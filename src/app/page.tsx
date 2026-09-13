import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { EventCard } from "@/components/event-card";

export default async function Home() {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    take: 3,
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      tiers: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-brand/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-brand">
            Kenyan events, one ticket at a time
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-6xl">
            Discover. Pay with M-Pesa.{" "}
            <span className="text-brand">Go.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Browse upcoming events in Kenya. Pay instantly with M-Pesa STK
            Push. Get your ticket — PDF with QR — delivered to your phone.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-brand px-8 font-semibold text-white hover:bg-brand-strong"
            >
              <Link href="/events">Browse Events</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-border text-foreground hover:bg-muted"
            >
              <Link href="/dashboard">My Tickets</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured events */}
      {events.length > 0 && (
        <section>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Coming Up
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Don&apos;t miss out — tickets are live now.
              </p>
            </div>
            <Link
              href="/events"
              className="text-sm font-semibold text-brand hover:underline"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="my-16 grid gap-4 md:grid-cols-3">
        {[
          {
            step: "01",
            title: "Find Events",
            body: "Search by category, date, or venue — all your favourite Kenyan events in one place.",
          },
          {
            step: "02",
            title: "Pay with M-Pesa",
            body: "STK push to your phone, tap PIN, done. No card details, no extra app.",
          },
          {
            step: "03",
            title: "Check In Fast",
            body: "Show your QR code at the door. Organisers scan and you're in.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              {item.step}
            </span>
            <h2 className="mt-3 font-display text-lg font-bold text-foreground">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}