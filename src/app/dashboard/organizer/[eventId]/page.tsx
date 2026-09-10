import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DeleteEventButton from "./delete-button";

export const dynamic = "force-dynamic";

type AttendeeDetail = {
  id: string;
  checkedIn: boolean;
  user: { name: string; email: string };
  ticketTier: { name: string };
};

type EventDetail = {
  id: string;
  title: string;
  venue: string;
  date: Date;
  time: string;
  description: string;
};

type EventData = {
  event: EventDetail;
  attendees: AttendeeDetail[];
  stats: { ticketsSold: number; revenue: number };
};

async function getEventData(eventId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return null;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;
  if (event.organizerId !== user.id && user.role !== "ADMIN") return null;

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

  return {
    event,
    attendees,
    stats: { ticketsSold, revenue },
  } as EventData;
}

export default async function OrganizerEventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const data = await getEventData(params.eventId);

  if (!data) {
    notFound();
  }

  const { event, attendees, stats } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{event.title}</h1>
          <p className="text-muted-foreground">
            {event.venue} · {new Date(event.date).toLocaleDateString()} · {event.time}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/dashboard/organizer/check-in/${event.id}`}>Start Check-In</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/dashboard/organizer/${event.id}/edit`}>Edit</Link>
          </Button>
          <DeleteEventButton eventId={event.id} />
          <Button asChild variant="outline">
            <Link href="/dashboard/organizer">Back</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-lg font-semibold">Sales Stats</h2>
          <div className="mt-2 text-sm text-muted-foreground">
            <p>Tickets sold: {stats.ticketsSold}</p>
            <p>Revenue: KES {stats.revenue.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-lg font-semibold">Event Details</h2>
          <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Attendees</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Ticket</th>
                <th className="text-left py-2">Checked In</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((attendee) => (
                <tr key={attendee.id} className="border-b">
                  <td className="py-2">{attendee.user.name}</td>
                  <td className="py-2">{attendee.user.email}</td>
                  <td className="py-2">{attendee.ticketTier.name}</td>
                  <td className="py-2">
                    {attendee.checkedIn ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
              {attendees.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-muted-foreground">
                    No attendees yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
