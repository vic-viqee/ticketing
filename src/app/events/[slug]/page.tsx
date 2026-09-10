import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type TicketTierSummary = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
};

type EventDetail = {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  description: string;
  tiers?: TicketTierSummary[];
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{event.title}</h1>
        <p className="text-muted-foreground">
          {event.venue} · {new Date(event.date).toLocaleDateString()} ·{" "}
          {event.time}
        </p>
        <p className="mt-2 max-w-3xl">{event.description}</p>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Tickets</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.id} className="p-4">
              <div className="flex flex-col gap-2">
                <div>
                  <h3 className="font-semibold">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    KES {tier.price.toLocaleString()}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tier.quantity - tier.sold} left
                </p>
                <Button asChild>
                  <Link href={`/checkout?tierId=${tier.id}`}>Buy</Link>
                </Button>
              </div>
            </Card>
          ))}
          {tiers.length === 0 && (
            <p className="text-muted-foreground">No ticket tiers yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
