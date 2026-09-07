import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { buildTicketPdfBuffer } from "@/lib/tickets/pdf";
import { sendTicketEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const callback = body.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ success: false, error: "Invalid callback" });
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const receiptNumber = (
      callback.CallbackMetadata?.Item as
        | { Name: string; Value?: string }[]
        | undefined
    )?.find((item) => item.Name === "MpesaReceiptNumber")?.Value;

    const order = await prisma.order.findFirst({
      where: { mpesaCheckoutRequestId: checkoutRequestId },
      include: { user: true, ticketTier: { include: { event: true } } },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" });
    }

    if (resultCode === 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          mpesaReceiptNumber: receiptNumber ?? order.mpesaReceiptNumber,
        },
      });

      const qrCodeToken = randomBytes(24).toString("hex");
      await prisma.order.update({
        where: { id: order.id },
        data: { qrCodeToken },
      });

      const ticket = await prisma.ticket.create({
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
        qrCodeToken: ticket.qrCodeToken,
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
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/mpesa/callback error", error);
    return NextResponse.json({ success: false, error: "Callback failed" });
  }
}
