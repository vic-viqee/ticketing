import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTicketPdfBuffer } from "@/lib/tickets/pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      event: true,
      ticketTier: true,
      user: { select: { name: true } },
      order: true,
    },
  });

  if (!ticket || ticket.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Ticket not found" },
      { status: 404 }
    );
  }

  if (ticket.order?.status !== "PAID") {
    return NextResponse.json(
      { success: false, error: "Ticket not paid" },
      { status: 400 }
    );
  }

  try {
    const pdfBuffer = await buildTicketPdfBuffer({
      attendeeName: ticket.user.name ?? "Attendee",
      eventName: ticket.event.title,
      eventDate: ticket.event.date.toISOString(),
      venue: ticket.event.venue,
      ticketTier: ticket.ticketTier.name,
      qrCodeToken: ticket.qrCodeToken,
    });

    const filename = `ticket-${ticket.id}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("PDF generation failed", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate ticket PDF" },
      { status: 500 }
    );
  }
}