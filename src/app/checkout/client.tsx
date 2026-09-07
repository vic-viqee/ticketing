"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

const checkoutSchema = z.object({
  phone: z.string().min(10),
});

type CheckoutInput = z.infer<typeof checkoutSchema>;

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tierId = searchParams.get("tierId");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (values: CheckoutInput) => {
    setError(null);
    setIsLoading(true);

    const response = await fetch("/api/mpesa/stk-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: values.phone,
        ticketTierId: tierId ?? undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setError(result.error ?? "Payment initiation failed");
      setIsLoading(false);
      return;
    }

    setCheckoutRequestId(result.data.checkoutRequestId);
    router.push(`/checkout/processing?checkoutRequestID=${result.data.checkoutRequestId}`);
  };

  if (checkoutRequestId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Card className="p-6">
          <p className="text-muted-foreground">Redirecting to payment processing...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>Enter your M-Pesa phone number to pay.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" type="tel" {...form.register("phone")} placeholder="254712345678" />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : "Pay with M-Pesa"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
