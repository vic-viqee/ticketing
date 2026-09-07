import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type OrganizerEvent = {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
};

async function getOrganizerEvents() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/organizer/events`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    success: boolean;
    data: OrganizerEvent[];
  };
  return json.data ?? [];
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
