import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTicketPdfBuffer } from "@/lib/tickets/pdf";
import { sendTicketEmail } from "@/lib/email";
import { getFluxConfig } from "@/lib/fluxpay";
import { getPaymentStatus } from "@/lib/fluxpay/sdk";

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { user: true; ticketTier: { include: { event: true } } };
}>;

/**
 * Synchronous part of fulfillment: update order → PAID, create ticket,
 * increment tier sold count. Call this inside the request handler.
 * Returns the updated order with QR token.
 */
export async function fulfillPaidOrder(order: OrderWithRelations) {
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

  return { ...order, qrCodeToken, status: "PAID" as const };
}

/**
 * Background part of fulfillment: generate PDF and send email.
 * Runs after the response is sent via Next.js after().
 */
function fulfillPaidOrderBackground(order: OrderWithRelations, qrCodeToken: string) {
  after(async () => {
    try {
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
    } catch (err) {
      console.error("[fulfillment] Background PDF/email failed:", err);
    }
  });
}

/**
 * Full fulfillment: sync (order + ticket) then background (PDF + email).
 * Use this from webhook and payment-status handlers.
 */
export async function fulfillOrder(order: OrderWithRelations) {
  const updated = await fulfillPaidOrder(order);
  fulfillPaidOrderBackground(order, updated.qrCodeToken);
  return updated;
}

/**
 * Call FluxPay status API for a pending order.
 * If FluxPay says SUCCESS → fulfill locally and return the result.
 * If FluxPay says FAILED → mark order FAILED.
 * If FluxPay is unreachable → fall back to DB-only status.
 */
export async function fulfillFromFluxPayStatus(checkoutRequestId: string) {
  const order = await prisma.order.findFirst({
    where: { mpesaCheckoutRequestId: checkoutRequestId },
    include: { user: true, ticketTier: { include: { event: true } } },
  });

  if (!order) {
    return { found: false as const };
  }

  // Already processed — nothing to do.
  if (order.status === "PAID") {
    return { found: true as const, status: "PAID" as const, order };
  }
  if (order.status === "FAILED") {
    return { found: true as const, status: "FAILED" as const, order };
  }

  // Order is PENDING — query FluxPay for the real status.
  try {
    const config = getFluxConfig();
    const res = await getPaymentStatus(config, checkoutRequestId);

    if (res.success && res.data) {
      const data = res.data as Record<string, unknown>;
      const fluxStatus = data.status as string | undefined;

      if (fluxStatus === "SUCCESS" || fluxStatus === "COMPLETED") {
        const receiptNumber = data.mpesaReceiptNo as string | undefined;
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
          const result = await fulfillOrder(updatedOrder);
          return { found: true as const, status: "PAID" as const, order: result };
        }
      }

      if (fluxStatus === "FAILED" || fluxStatus === "CANCELLED") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        });
        return { found: true as const, status: "FAILED" as const, order };
      }
    }
  } catch (err) {
    console.error("[fulfillment] FluxPay status API unreachable, falling back to DB:", err);
  }

  // FluxPay still says PENDING or is unreachable — return current DB status.
  return { found: true as const, status: order.status, order };
}
