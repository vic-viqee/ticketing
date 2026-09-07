import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <section className="flex flex-col items-start gap-6">
        <h1 className="text-4xl font-semibold tracking-tight">
          Discover and book events in Kenya.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Browse upcoming events, buy tickets with M-Pesa, and get instant
          PDF tickets delivered to your email.
        </p>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/events">Browse Events</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">My Tickets</Link>
          </Button>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Find Events</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Search and filter events by category, date, and location.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Buy with M-Pesa</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pay instantly using M-Pesa STK Push and receive your ticket by
            email.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Check In Fast</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Organizers scan QR codes at entry for seamless check-ins.
          </p>
        </Card>
      </section>
    </div>
  );
}
