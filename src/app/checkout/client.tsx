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
import { BrandMark } from "@/components/brand-mark";

const checkoutSchema = z.object({
  phone: z.string().min(10),
});

type CheckoutInput = z.infer<typeof checkoutSchema>;

const STEPS = ["Select ticket", "Enter M-Pesa", "Done"];

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
        <Card className="flex items-center gap-3 p-6">
          <BrandMark className="h-8 w-8 animate-pulse" />
          <p className="text-muted-foreground">
            Redirecting to payment processing...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      {/* Stepper */}
      <ol className="mb-6 flex items-center justify-center gap-2 text-xs">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span
              className={
                i === 1
                  ? "flex h-6 w-6 items-center justify-center rounded-full bg-brand font-bold text-white"
                  : "flex h-6 w-6 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground"
              }
            >
              {i + 1}
            </span>
            <span
              className={
                i === 1 ? "font-semibold text-foreground" : "text-muted-foreground"
              }
            >
              {step}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px w-6 bg-border" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl font-bold text-foreground">
            Checkout
          </CardTitle>
          <CardDescription>
            Enter the M-Pesa number you&apos;ll pay with. An STK push will be
            sent to your phone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa phone number</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                placeholder="254712345678"
                className="h-11 text-base"
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="h-11 w-full bg-mpesa font-semibold text-white hover:bg-mpesa/90"
              disabled={isLoading}
            >
              {isLoading ? "Sending STK push..." : "Pay with M-Pesa ✓"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              You&apos;ll receive a prompt on your phone to confirm the payment.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}