import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fulfillFromFluxPayStatus } from "@/lib/fulfillment";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkoutRequestId = searchParams.get("checkoutRequestID");

  if (!checkoutRequestId) {
    return NextResponse.json(
      { success: false, error: "checkoutRequestID is required" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findFirst({
    where: { mpesaCheckoutRequestId: checkoutRequestId },
    include: { ticketTier: true },
  });

  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  // If the order is still PENDING, ask FluxPay for the real status.
  if (order.status === "PENDING") {
    const result = await fulfillFromFluxPayStatus(checkoutRequestId);

    if (result.found && result.status !== "PENDING") {
      // Status changed — return the updated order from DB.
      const updatedOrder = await prisma.order.findFirst({
        where: { mpesaCheckoutRequestId: checkoutRequestId },
        include: { ticketTier: true },
      });
      if (updatedOrder) {
        return NextResponse.json({
          success: true,
          data: {
            status: updatedOrder.status,
            amount: updatedOrder.amount,
            ticketTier: updatedOrder.ticketTier.name,
            qrCodeToken: updatedOrder.qrCodeToken,
          },
        });
      }
    }
    // FluxPay still says PENDING or is unreachable — fall through to DB status.
  }

  return NextResponse.json({
    success: true,
    data: {
      status: order.status,
      amount: order.amount,
      ticketTier: order.ticketTier.name,
      qrCodeToken: order.qrCodeToken,
    },
  });
}
