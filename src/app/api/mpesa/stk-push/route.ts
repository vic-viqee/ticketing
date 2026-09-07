import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

    const { initiateStkPush } = await import("@/lib/mpesa/stkpush");
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    const result = await initiateStkPush({
      phone: parsed.data.phone,
      amount: tier.price,
      accountReference: `EVENT-${tier.eventId}`,
      transactionDesc: tier.name,
      callbackUrl,
    });

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        ticketTierId: tier.id,
        eventId: tier.eventId,
        amount: tier.price,
        status: "PENDING",
        mpesaCheckoutRequestId: result.CheckoutRequestID,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutRequestId: result.CheckoutRequestID,
        orderId: order.id,
        merchantRequestId: result.MerchantRequestID,
      },
    });
  } catch (error) {
    console.error("/api/mpesa/stk-push error", error);
    return NextResponse.json(
      { success: false, error: "Payment initiation failed" },
      { status: 500 }
    );
  }
}
