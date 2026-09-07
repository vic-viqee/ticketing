import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type EventSummary = {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  slug: string;
};

async function getEvents() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/events`, { cache: "no-store" });
  const json = (await res.json()) as {
    success: boolean;
    data: EventSummary[];
  };
  return json.data ?? [];
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Events</h1>
        <form className="flex items-center gap-2" method="GET">
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Search events..."
            name="search"
          />
          <Button type="submit">Search</Button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="p-4">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-lg font-semibold">{event.title}</h2>
                <p className="text-sm text-muted-foreground">{event.venue}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(event.date).toLocaleDateString()} · {event.time}
              </div>
              <Button asChild>
                <Link href={`/events/${event.slug}`}>View</Link>
              </Button>
            </div>
          </Card>
        ))}
        {events.length === 0 && (
          <p className="text-muted-foreground">No events found.</p>
        )}
      </div>
    </div>
  );
}
