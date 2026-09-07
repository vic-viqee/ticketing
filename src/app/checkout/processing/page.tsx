import { Suspense } from "react";
import CheckoutProcessingClient from "./client";

export default function CheckoutProcessingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-8">Loading...</div>}>
      <CheckoutProcessingClient />
    </Suspense>
  );
}
