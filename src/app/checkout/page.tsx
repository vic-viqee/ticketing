import { Suspense } from "react";
import CheckoutClient from "./client";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-8">Loading...</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
