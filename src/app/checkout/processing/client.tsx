"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandMark } from "@/components/brand-mark";

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
    <div className="mx-auto max-w-xl px-4 py-12">
      <div
        className="relative flex items-center justify-center"
        aria-hidden="true"
      >
        <BrandMark
          className={
            status === null || status === "PENDING"
              ? "h-20 w-20 animate-spin [animation-duration:6s]"
              : "h-20 w-20"
          }
        />
      </div>

      <Card className="mt-6 overflow-hidden text-center">
        <div className="p-6">
          <h1 className="font-display text-xl font-bold text-foreground">
            Payment Status
          </h1>
          <div className="mt-3 text-muted-foreground">
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <>
                {status === null && (
                  <p>
                    Waiting for payment confirmation...
                    <br />
                    <span className="text-sm text-muted-foreground">
                      Check your phone and approve the M-Pesa prompt.
                    </span>
                  </p>
                )}
                {status === "PENDING" && (
                  <p>
                    Payment is still pending on M-Pesa.
                    <br />
                    <span className="text-sm text-muted-foreground">
                      Approve the STK push on your phone to continue.
                    </span>
                  </p>
                )}
                {status === "PAID" && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mpesa text-xl text-white">
                      ✓
                    </span>
                    <p>
                      Payment successful! Your ticket has been sent to your
                      email.
                    </p>
                  </div>
                )}
                {status === "FAILED" && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-xl text-white">
                      !
                    </span>
                    <p>Payment unsuccessful. Please try again.</p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Button asChild className="bg-brand text-white hover:bg-brand-strong">
              <Link href="/dashboard/tickets">View My Tickets</Link>
            </Button>
            {status === "FAILED" && (
              <Button variant="outline" asChild>
                <Link href="/events">Browse events</Link>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}