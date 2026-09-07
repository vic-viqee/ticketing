import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const tierSchema = z.object({
  name: z.string().min(2),
  price: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  salesStart: z.string().optional(),
  salesEnd: z.string().optional(),
});

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
  const parsed = tierSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  const tier = await prisma.ticketTier.create({
    data: {
      name: parsed.data.name,
      price: parsed.data.price,
      quantity: parsed.data.quantity,
      salesStart: parsed.data.salesStart ? new Date(parsed.data.salesStart) : undefined,
      salesEnd: parsed.data.salesEnd ? new Date(parsed.data.salesEnd) : undefined,
      eventId: event.id,
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: tier,
    },
    { status: 201 }
  );
}
