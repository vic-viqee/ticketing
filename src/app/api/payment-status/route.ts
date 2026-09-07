import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
