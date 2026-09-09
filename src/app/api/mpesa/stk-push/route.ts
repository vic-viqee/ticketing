import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { initiatePayment } from "@/lib/fluxpay/sdk";
import { formatFluxPhone, getFluxConfig } from "@/lib/fluxpay";

const stkPushSchema = z.object({
  phone: z.string().min(10),
  ticketTierId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = stkPushSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const tier = await prisma.ticketTier.findUnique({
      where: { id: parsed.data.ticketTierId },
      include: { event: true },
    });

    if (!tier) {
      return NextResponse.json(
        { success: false, error: "Ticket tier not found" },
        { status: 404 }
      );
    }

    if (tier.sold >= tier.quantity) {
      return NextResponse.json(
        { success: false, error: "Ticket tier sold out" },
        { status: 400 }
      );
    }

    // Create/reuse the Order first so its id can be used as the idempotency
    // key: if the network drops the response after FluxPay accepted the push,
    // a retry reuses this order (same key) and cannot double-charge.
    let order = await prisma.order.findFirst({
      where: { userId: user.id, ticketTierId: tier.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    order ??= await prisma.order.create({
      data: {
        userId: user.id,
        ticketTierId: tier.id,
        eventId: tier.eventId,
        amount: tier.price,
        status: "PENDING",
      },
    });

    try {
      const result = await initiatePayment(getFluxConfig(), {
        amount: tier.price,
        phoneNumber: formatFluxPhone(parsed.data.phone),
        reference: `EVT-${order.id.slice(0, 6)}`,
        description: tier.name,
        idempotencyKey: order.id,
      });

      const checkoutRequestId = (result.data as { checkoutRequestId?: string })
        ?.checkoutRequestId;

      if (!checkoutRequestId) {
        throw new Error("FluxPay did not return a checkoutRequestId");
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { mpesaCheckoutRequestId: checkoutRequestId },
      });

      return NextResponse.json({
        success: true,
        data: { checkoutRequestId, orderId: order.id },
      });
    } catch (pushError) {
      // Keep the PENDING order: it is the idempotency anchor for retries.
      console.error("FluxPay STK push failed", pushError);
      throw pushError;
    }
  } catch (error) {
    console.error("/api/mpesa/stk-push error", error);
    return NextResponse.json(
      { success: false, error: "Payment initiation failed" },
      { status: 500 }
    );
  }
}