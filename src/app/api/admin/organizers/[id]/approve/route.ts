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

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const body = await request.json();
  const { action } = body as { action?: "approve" | "reject" };

  if (!action || (action !== "approve" && action !== "reject")) {
    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
  });

  if (!target || target.role !== "ORGANIZER") {
    return NextResponse.json(
      { success: false, error: "Organizer not found" },
      { status: 404 }
    );
  }

  if (action === "approve") {
    await prisma.user.update({
      where: { id: target.id },
      data: { approved: true },
    });
  } else {
    await prisma.user.update({
      where: { id: target.id },
      data: { role: "ATTENDEE", approved: true },
    });
  }

  return NextResponse.json({ success: true });
}
