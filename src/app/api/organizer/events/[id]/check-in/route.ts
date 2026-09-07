import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
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

  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id: eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return NextResponse.json(
      { success: false, error: "Event not found" },
      { status: 404 }
    );
  }

  if (event.organizerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { qrCodeToken } = body as { qrCodeToken?: string };

  if (!qrCodeToken) {
    return NextResponse.json(
      { success: false, error: "qrCodeToken is required" },
      { status: 400 }
    );
  }

  const ticket = await prisma.ticket.findUnique({
    where: { qrCodeToken },
    include: {
      user: { select: { name: true } },
      ticketTier: true,
      order: true,
    },
  });

  if (!ticket || ticket.eventId !== eventId) {
    return NextResponse.json({ success: false, error: "Invalid ticket" });
  }

  if (ticket.order?.status !== "PAID") {
    return NextResponse.json({ success: false, error: "Ticket not paid" });
  }

  if (ticket.checkedIn) {
    return NextResponse.json({
      success: true,
      data: {
        checkedIn: true,
        attendeeName: ticket.user.name,
        ticketTier: ticket.ticketTier.name,
      },
    });
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      checkedIn: true,
      checkedInAt: new Date(),
    },
  });

  await prisma.order.update({
    where: { id: ticket.orderId },
    data: {
      checkedIn: true,
      checkedInAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      checkedIn: false,
      attendeeName: ticket.user.name,
      ticketTier: ticket.ticketTier.name,
    },
  });
}
