import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  date: z.string().min(1),
  time: z.string().min(1),
  venue: z.string().min(2),
  category: z.string().min(2),
  image: z.string().url().optional().nullable(),
});

async function authorize(_request: Request, eventId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { user: null, error: NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    ) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return { user: null, error: NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    ) };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return { user: null, error: NextResponse.json(
      { success: false, error: "Event not found" },
      { status: 404 }
    ) };
  }

  if (event.organizerId !== user.id && user.role !== "ADMIN") {
    return { user: null, error: NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    ) };
  }

  return { user, event, error: null };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authorize(_request, id);
  if (auth.error) return auth.error;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { tiers: true },
  });

  return NextResponse.json({ success: true, data: event });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authorize(request, id);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  const baseSlug = parsed.data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = baseSlug;
  let counter = 1;
  while (
    (await prisma.event.findFirst({ where: { slug, NOT: { id } } }))
  ) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      date: new Date(parsed.data.date),
      time: parsed.data.time,
      venue: parsed.data.venue,
      category: parsed.data.category,
      image: parsed.data.image ?? null,
      slug,
    },
  });

  return NextResponse.json({ success: true, data: event });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authorize(request, id);
  if (auth.error) return auth.error;

  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
