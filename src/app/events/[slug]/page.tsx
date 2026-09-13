import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EventSummary } from "@/components/event-card";

export const dynamic = "force-dynamic";

type EventDetail = EventSummary & {
  description: string | null;
  organizer?: { id: string; name: string | null; email: string } | null;
  tiers?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    sold: number;
  }[];
};

async function getEvent(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/events/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    success: boolean;
    data: EventDetail | null;
  };
  return json.data ?? null;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  const tiers = event.tiers ?? [];
  const totalSold = tiers.reduce((t, tier) => t + tier.sold, 0);
  const totalQty = tiers.reduce((t, tier) => t + tier.quantity, 0);
  const percentGoing = totalQty ? Math.round((totalSold / totalQty) * 100) : 0;
  const midTierIdx = Math.floor(tiers.length / 2);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Hero header */}
      <header className="border-b border-border pb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          {event.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          {event.category && (
            <span className="rounded-full bg-brand/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-brand">
              {event.category}
            </span>
          )}
          <span>{formatDate(event.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{event.time}</span>
          <span aria-hidden="true">·</span>
          <span>{event.venue}</span>
        </div>
        {totalQty > 0 && (
          <div className="mt-5 flex max-w-md flex-col gap-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(percentGoing, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              <strong className="font-bold text-foreground">
                {totalSold} going
              </strong>{" "}
              · {totalQty - totalSold} spots left
            </p>
          </div>
        )}
      </header>

      {event.image && (
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border">
          <Image
            src={event.image}
            alt={event.title}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 1200px, 100vw"
          />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">
            About this event
          </h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
            {event.description}
          </p>
          {event.organizer?.name && (
            <p className="mt-6 text-sm text-muted-foreground">
              Organised by{" "}
              <span className="font-semibold text-foreground">
                {event.organizer.name}
              </span>
            </p>
          )}
        </section>

        <aside>
          <h2 className="font-display text-xl font-bold text-foreground">
            Tickets
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {tiers.map((tier, i) => {
              const left = tier.quantity - tier.sold;
              const fetching = left <= 15;
              const isMid = i === midTierIdx && tiers.length > 1;
              return (
                <Card
                  key={tier.id}
                  className={
                    isMid
                      ? "relative border-2 border-brand p-5"
                      : "relative border border-border p-5"
                  }
                >
                  {isMid && (
                    <span className="absolute -top-3 left-4 rounded-full bg-brand px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                      Most popular
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-foreground">
                        {tier.name}
                      </h3>
                      <p className="mt-1 font-display text-2xl font-extrabold text-brand">
                        KES {tier.price.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={
                        fetching
                          ? "rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand"
                          : "rounded-full bg-mpesa/10 px-2.5 py-0.5 text-xs font-semibold text-mpesa"
                      }
                    >
                      {fetching ? `${left} left` : "Available"}
                    </span>
                  </div>
                  <Button
                    asChild
                    className={
                      isMid
                        ? "mt-4 w-full bg-brand font-semibold text-white hover:bg-brand-strong"
                        : "mt-4 w-full bg-foreground font-semibold text-background hover:bg-foreground/90"
                    }
                  >
                    <Link href={`/checkout?tierId=${tier.id}`}>Buy &rarr;</Link>
                  </Button>
                </Card>
              );
            })}
            {tiers.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Ticket tiers for this event haven&apos;t been released yet.
              </p>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Pay with M-Pesa STK Push. A PDF ticket with QR will be emailed to
            you instantly.
          </p>
        </aside>
      </div>
    </div>
  );
}