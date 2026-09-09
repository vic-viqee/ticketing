import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildTicketPdfBuffer } from "@/lib/tickets/pdf";
import { sendTicketEmail } from "@/lib/email";
import { getFluxWebhookSecret } from "@/lib/fluxpay";
import { verifyWebhookSignature } from "@/lib/fluxpay/sdk";

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { user: true; ticketTier: { include: { event: true } } };
}>;

async function fulfillPaidOrder(order: OrderWithRelations) {
  const qrCodeToken = randomBytes(24).toString("hex");
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAID", qrCodeToken },
  });

  await prisma.ticket.create({
    data: {
      orderId: order.id,
      ticketTierId: order.ticketTierId,
      eventId: order.eventId,
      userId: order.userId,
      qrCodeToken,
    },
  });

  await prisma.ticketTier.update({
    where: { id: order.ticketTierId },
    data: { sold: { increment: 1 } },
  });

  const pdfBufferRaw = await buildTicketPdfBuffer({
    attendeeName: order.user.name ?? "Guest",
    eventName: order.ticketTier.event.title,
    eventDate: order.ticketTier.event.date.toISOString(),
    venue: order.ticketTier.event.venue,
    ticketTier: order.ticketTier.name,
    qrCodeToken,
  });

  const pdfBuffer = Buffer.isBuffer(pdfBufferRaw)
    ? pdfBufferRaw
    : Buffer.from(
        (pdfBufferRaw as unknown as ReadableStream).pipeThrough(
          new TextEncoderStream()
        ) as unknown as ArrayBuffer
      );

  await sendTicketEmail({
    to: order.user.email,
    attendeeName: order.user.name ?? "Guest",
    eventName: order.ticketTier.event.title,
    pdfBuffer,
  });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    const signature = request.headers.get("X-Webhook-Signature") ?? "";
    const valid = await verifyWebhookSignature({
      rawBody,
      signature,
      secret: getFluxWebhookSecret(),
    });

    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, {
        status: 401,
      });
    }

    let payload: { event?: string; data?: Record<string, unknown> };
    try {
      payload = JSON.parse(rawBody) as { event?: string; data?: Record<string, unknown> };
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, {
        status: 400,
      });
    }

    // Always acknowledge non-payment events (e.g. "ping" test webhooks).
    if (payload.event !== "payment.success" && payload.event !== "payment.failed") {
      return NextResponse.json({ success: true });
    }

    const checkoutRequestId = payload.data?.checkoutRequestId as string | undefined;
    if (!checkoutRequestId) {
      return NextResponse.json({ success: false, error: "Missing checkoutRequestId" }, {
        status: 400,
      });
    }

    const order = await prisma.order.findFirst({
      where: { mpesaCheckoutRequestId: checkoutRequestId },
      include: { user: true, ticketTier: { include: { event: true } } },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, {
        status: 404,
      });
    }

    // Idempotency guard: a replayed webhook must never double-process an order.
    if (order.status === "PAID") {
      return NextResponse.json({ success: true });
    }

    if (payload.event === "payment.success") {
      const receiptNumber = payload.data?.mpesaReceiptNo as string | undefined;
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          mpesaReceiptNumber: receiptNumber ?? order.mpesaReceiptNumber,
        },
      });

      const updatedOrder = await prisma.order.findFirst({
        where: { id: order.id },
        include: { user: true, ticketTier: { include: { event: true } } },
      });
      if (updatedOrder) {
        await fulfillPaidOrder(updatedOrder);
      }
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/mpesa/callback error", error);
    return NextResponse.json({ success: false, error: "Callback failed" }, {
      status: 500,
    });
  }
}