import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const attendees = await prisma.ticket.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      ticketTier: true,
      order: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const ticketsSold = attendees.length;
  const revenue = attendees.reduce(
    (sum, ticket) => sum + (ticket.order?.amount ?? 0),
    0
  );

  return NextResponse.json({
    success: true,
    data: {
      event,
      attendees,
      stats: {
        ticketsSold,
        revenue,
      },
    },
  });
}
