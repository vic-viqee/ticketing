import Image from "next/image";
import Link from "next/link";

export type EventSummary = {
  id: string;
  title: string;
  description: string | null;
  date: string | Date;
  time: string;
  venue: string;
  category?: string | null;
  image?: string | null;
  slug: string;
  organizer?: { id: string; name: string | null; email: string } | null;
  tiers?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    sold: number;
  }[];
};

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function eventStats(event: EventSummary) {
  const tiers = event.tiers ?? [];
  const sold = tiers.reduce((t, tier) => t + tier.sold, 0);
  const capacity = tiers.reduce((t, tier) => t + tier.quantity, 0);
  const fromPrice = tiers.length
    ? Math.min(...tiers.map((t) => t.price))
    : null;
  return { sold, capacity, fromPrice };
}

export function EventCard({ event }: { event: EventSummary }) {
  const { sold, capacity, fromPrice } = eventStats(event);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="placeholder-tile flex h-full w-full items-center justify-center">
            <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {event.category ?? "Event"}
            </span>
          </div>
        )}
        {event.category && event.image && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
            {event.category}
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col gap-1.5 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>{formatDate(event.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{event.time}</span>
        </div>
        <h3 className="font-display text-lg font-bold leading-snug text-foreground group-hover:text-brand">
          {event.title}
        </h3>
        <p className="text-sm text-muted-foreground">{event.venue}</p>

        <div className="mt-auto flex items-center justify-between pt-3 text-sm">
          <span className="font-bold text-foreground">
            {fromPrice === null ? (
              "Tickets soon"
            ) : (
              <>
                From KES {fromPrice.toLocaleString()}
              </>
            )}
          </span>
          {capacity > 0 && (
            <span className="text-xs text-muted-foreground">
              {sold} going · {capacity - sold} left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}