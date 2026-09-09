/**
 * Register the FluxPay webhook that delivers payment callbacks to this app.
 *
 * Usage:
 *   npx tsx scripts/register-fluxpay-webhook.ts
 *
 * Reads FLUXPAY_API_KEY / FLUXPAY_API_SECRET / FLUXPAY_BASE_URL and
 * NEXT_PUBLIC_APP_URL from the environment (or .env at the repo root).
 * Prints the webhook id and its signing secret — save the secret into
 * FLUXPAY_WEBHOOK_SECRET; the back-end signs every delivery with it.
 */
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

const ENV_FILE = ".env";
if (existsSync(ENV_FILE)) {
  loadEnvFile(ENV_FILE);
}

const apiKey = process.env.FLUXPAY_API_KEY;
const apiSecret = process.env.FLUXPAY_API_SECRET;
const baseURL = (process.env.FLUXPAY_BASE_URL ?? "https://fluxpay-backend.onrender.com").replace(/\/+$/, "");
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!apiKey || !apiSecret) {
  console.error("Missing FLUXPAY_API_KEY / FLUXPAY_API_SECRET.");
  process.exit(1);
}
if (!appUrl) {
  console.error("Missing NEXT_PUBLIC_APP_URL.");
  process.exit(1);
}

async function main() {
  const webhookUrl = `${appUrl!.replace(/\/+$/, "")}/api/mpesa/callback`;

  const res = await fetch(`${baseURL}/api/v1/webhooks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": apiKey!,
      "X-API-Secret": apiSecret!,
    },
    body: JSON.stringify({
      url: webhookUrl,
      name: "ticketing",
      events: ["payment.success", "payment.failed"],
    }),
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    console.error(`Webhook registration failed (${res.status}):`, body);
    process.exit(1);
  }

  const data = body.data as Record<string, string> | undefined;
  console.log("Webhook registered:", webhookUrl);
  console.log("webhookId:", data?.id ?? data?.webhookId ?? "(see response above)");
  console.log("webhookSecret:", data?.secret ?? data?.webhookSecret ?? "(see response above)");
  console.log("\nSave webhookSecret as FLUXPAY_WEBHOOK_SECRET in .env — it is shown only once.");
}

main();