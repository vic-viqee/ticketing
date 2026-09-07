"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | null;

export default function CheckoutProcessingClient() {
  const searchParams = useSearchParams();
  const checkoutRequestId = searchParams.get("checkoutRequestID");
  const [status, setStatus] = useState<PaymentStatus>(null);
  const [error] = useState<string | null>(
    checkoutRequestId ? null : "Missing checkout request ID"
  );

  useEffect(() => {
    if (!checkoutRequestId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment-status?checkoutRequestID=${checkoutRequestId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setStatus(json.data.status);
          if (json.data.status === "PAID" || json.data.status === "FAILED") {
            clearInterval(interval);
          }
        }
      } catch {
        // keep polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [checkoutRequestId]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Card className="p-6">
        <h1 className="text-xl font-semibold">Payment Status</h1>
        <p className="mt-2 text-muted-foreground">
          {status === null && "Waiting for payment confirmation..."}
          {status === "PENDING" && "Payment is still pending."}
          {status === "PAID" && "Payment successful! Your ticket has been sent to your email."}
          {status === "FAILED" && "Payment failed. Please try again."}
        </p>
        {error && <p className="mt-2 text-destructive">{error}</p>}
        <div className="mt-4">
          <a className="inline-flex" href="/dashboard/tickets">
            <Button>View My Tickets</Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
