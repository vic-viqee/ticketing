import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";

export default async function AttendeeTicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const tickets = user
    ? await prisma.ticket.findMany({
        where: { userId: user.id },
        include: {
          event: {
            select: { title: true, date: true, time: true, venue: true },
          },
          ticketTier: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground">My Tickets</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {tickets.length === 0
          ? "You haven't bought any tickets yet."
          : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} purchased.`}
      </p>

      {tickets.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">No tickets yet.</p>
          <Button asChild className="mt-4 bg-brand text-white hover:bg-brand-strong">
            <Link href="/events">Browse events</Link>
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="relative overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-base font-bold text-foreground">
                    {ticket.event.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand">
                    {ticket.ticketTier.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(ticket.event.date).toLocaleDateString("en-KE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                    {ticket.event.time ? ` · ${ticket.event.time}` : ""}
                    <br />
                    {ticket.event.venue}
                  </p>
                </div>
                <BrandMark className="h-10 w-10 shrink-0" />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dashed pt-4">
                <span
                  className={
                    ticket.checkedIn
                      ? "rounded-full bg-mpesa/10 px-2.5 py-1 text-xs font-semibold text-mpesa"
                      : "rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                  }
                >
                  {ticket.checkedIn ? "Checked in" : "Not checked in"}
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/api/tickets/${ticket.id}/download`}>
                    Download PDF
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}