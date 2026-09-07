"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const tierSchema = z.object({
  name: z.string().min(2),
  price: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  salesStart: z.string().optional(),
  salesEnd: z.string().optional(),
});

type TierFormValues = z.input<typeof tierSchema>;

type Tier = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function EventTiersPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);

  const form = useForm<TierFormValues>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      name: "",
      price: 0,
      quantity: 0,
    },
  });

  const onSubmit = async (values: TierFormValues) => {
    setError(null);
    setIsLoading(true);

    const response = await fetch(`/api/events/${eventId}/tiers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        price: Number(values.price),
        quantity: Number(values.quantity),
        salesStart: values.salesStart,
        salesEnd: values.salesEnd,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setError(result.error ?? "Failed to add tier");
      setIsLoading(false);
      return;
    }

    setTiers((prev) => [...prev, result.data]);
    form.reset();
    setIsLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Ticket Tier</CardTitle>
          <CardDescription>Create a ticket tier for this event.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (KES)</Label>
                <Input id="price" type="number" {...form.register("price")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" {...form.register("quantity")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salesStart">Sales Start</Label>
                <Input id="salesStart" type="datetime-local" {...form.register("salesStart")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesEnd">Sales End</Label>
                <Input id="salesEnd" type="datetime-local" {...form.register("salesEnd")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventId">Event ID</Label>
              <Input
                id="eventId"
                value={eventId ?? ""}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Paste event ID here"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !eventId}>
              {isLoading ? "Adding..." : "Add Tier"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {tiers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Tiers</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card key={tier.id} className="p-4">
                <div className="flex flex-col gap-2">
                  <div>
                    <h3 className="font-semibold">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">KES {tier.price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Qty: {tier.quantity}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
