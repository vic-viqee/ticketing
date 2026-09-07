import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register";

  const isPublicApi =
    request.nextUrl.pathname.startsWith("/api/auth/") ||
    request.nextUrl.pathname === "/api/mpesa/callback" ||
    request.nextUrl.pathname.startsWith("/api/events");

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublicApi) {
    return NextResponse.next();
  }

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isDashboard && token) {
    const role = (token.role as string | undefined) ?? "ATTENDEE";
    if (
      request.nextUrl.pathname.startsWith("/dashboard/admin") &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (
      request.nextUrl.pathname.startsWith("/dashboard/organizer") &&
      role !== "ORGANIZER" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|uploads|favicon.ico).*)"],
};