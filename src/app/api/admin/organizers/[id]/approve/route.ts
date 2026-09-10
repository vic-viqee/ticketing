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

  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded");
  let action: string | undefined;
  if (isForm) {
    const form = await request.formData();
    action = String(form.get("action") ?? "");
  } else {
    const body = (await request.json()) as { action?: string };
    action = body.action;
  }

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

  if (isForm) {
    return NextResponse.redirect(new URL("/admin", request.url), 303);
  }
  return NextResponse.json({ success: true });
}
