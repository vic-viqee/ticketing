import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request) {
  const url = new URL(_request.url);
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");

  const where: Prisma.EventWhereInput = {};

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { venue: { contains: search, mode: "insensitive" } },
    ];
  }

  if (dateFrom || dateTo) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    where.date = dateFilter;
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      organizer: {
        select: { id: true, name: true, email: true },
      },
      tiers: true,
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    success: true,
    data: events,
  });
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}