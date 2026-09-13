import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export default async function DashboardPage() {
  const role = await getRoleFromSession();

  const cards = [
    {
      href: "/dashboard/tickets",
      title: "My Tickets",
      description: "View and download the tickets you've bought.",
      tag: "Attendees",
      show: true,
    },
    {
      href: "/dashboard/organizer",
      title: "Organizer Studio",
      description: "Create events, set ticket tiers, and check people in.",
      tag: role === "ORGANIZER" || role === "ADMIN" ? "Organizers" : null,
      show: role === "ORGANIZER" || role === "ADMIN",
    },
    {
      href: "/admin",
      title: "Admin",
      description: "Approve organizers and manage the platform.",
      tag: "Admin",
      show: role === "ADMIN",
    },
  ].filter((card) => card.show);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand"
        >
          {card.tag && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {card.tag}
            </span>
          )}
          <h2 className="mt-3 font-display text-lg font-bold text-foreground">
            {card.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {card.description}
          </p>
          <span className="mt-4 block text-sm font-semibold text-brand group-hover:underline">
            Open →
          </span>
        </Link>
      ))}
    </div>
  );
}