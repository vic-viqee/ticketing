import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventCard, type EventSummary } from "@/components/event-card";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "All",
  "Music",
  "Comedy",
  "Sports",
  "Arts",
  "Tech",
  "Business",
  "Food",
  "Other",
];

async function getEvents(search: string, category: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category && category !== "All") params.set("category", category);
  const res = await fetch(`${base}/api/events?${params}`, { cache: "no-store" });
  const json = (await res.json()) as {
    success: boolean;
    data: EventSummary[];
  };
  return json.data ?? [];
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { search = "", category = "All" } = await searchParams;
  const events = await getEvents(search, category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
              Events
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {events.length} upcoming event{events.length === 1 ? "" : "s"}
            </p>
          </div>
          <form
            className="flex items-center gap-2"
            method="GET"
            action="/events"
          >
            <input
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="Search events..."
              name="search"
              defaultValue={search}
            />
            <Button type="submit" className="bg-brand text-white hover:bg-brand-strong">
              Search
            </Button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <Link
                key={c}
                href={{ pathname: "/events", query: c === "All" ? {} : { category: c } }}
                className={
                  active
                    ? "rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white"
                    : "rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                }
              >
                {c}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {events.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center text-sm text-muted-foreground">
            No events match your search yet.
          </div>
        )}
      </div>
    </div>
  );
}