import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandMark } from "@/components/brand-mark";

async function getRoleFromSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!user) {
    redirect("/login");
  }
  return user.role;
}

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/tickets", label: "My Tickets" },
  { href: "/dashboard/organizer", label: "Organizer" },
  { href: "/admin", label: "Admin" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getRoleFromSession();

  const nav = NAV.filter((item) => {
    if (item.href === "/dashboard/organizer") {
      return role === "ORGANIZER" || role === "ADMIN";
    }
    if (item.href === "/admin") {
      return role === "ADMIN";
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandMark className="h-9 w-9" />
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Dashboard
          </h1>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {role.toLowerCase()}
        </span>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}