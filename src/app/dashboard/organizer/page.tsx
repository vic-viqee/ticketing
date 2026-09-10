import Link from "next/link";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getOrganizerEvents() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return [];
  return prisma.event.findMany({
    where: { organizerId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, venue: true, date: true, time: true },
  });
}

export default async function OrganizerPage() {
  const events = await getOrganizerEvents();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">My Events</h1>
        <Button asChild>
          <Link href="/dashboard/organizer/new">Create Event</Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="p-4">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-lg font-semibold">{event.title}</h2>
                <p className="text-sm text-muted-foreground">{event.venue}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.date).toLocaleDateString()} · {event.time}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link href={`/dashboard/organizer/${event.id}`}>Manage</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={`/dashboard/organizer/check-in/${event.id}`}>Check-In</Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {events.length === 0 && (
          <p className="text-muted-foreground">No events yet.</p>
        )}
      </div>
    </div>
  );
}
