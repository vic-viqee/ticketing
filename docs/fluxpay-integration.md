# FluxPay M-Pesa Gateway — Consumer Integration Guide

How any project can take M-Pesa payments through **FluxPay** (a Daraja
aggregator). Written from the living, working integration in this repo —
use `src/lib/fluxpay/sdk.ts` and `/api/mpesa/*` as reference, or copy the
patterns described below into your own stack.

## 1. Concept

FluxPay sits between you and Safaricom Daraja. You initiate an STK push
against FluxPay; FluxPay sends the push to the customer's phone; when the
customer approves, Safaricom settles with FluxPay, which notifies **you**
over a signed webhook. You never touch Daraja credentials.

- Base URL (default): `https://fluxpay-backend.onrender.com`
- API prefix: `/api/v1`
- Auth: every request carries two headers — `X-API-Key` (public, `fpk_...`)
  and `X-API-Secret` (shown once when the business account is created).
- Webhooks verify with HMAC-SHA256 (hex) over the **raw** request body.

## 2. Environment variables

```env
FLUXPAY_API_KEY=fpk_...
FLUXPAY_API_SECRET=...
FLUXPAY_BASE_URL=https://fluxpay-backend.onrender.com
FLUXPAY_WEBHOOK_SECRET=...   # returned once when you register a webhook
NEXT_PUBLIC_APP_URL=https://your-app.example.com
```

Never expose `FLUXPAY_API_SECRET` or `FLUXPAY_WEBHOOK_SECRET` to the client.

## 3. Initiate a payment (STK push)

`POST /api/v1/payments`

```bash
curl -X POST https://fluxpay-backend.onrender.com/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-API-Key: fpk_..." \
  -H "X-API-Secret: ..." \
  -H "X-Idempotency-Key: order-1a2b3c" \
  -d '{
      "amount": 500,
      "phoneNumber": "254712345678",
      "reference": "EVT-ABC123",
      "description": "Early Bird ticket"
    }'
```

- `amount` — in KES (whole numbers).
- `phoneNumber` — E.164 local format `2547XXXXXXXX` (a `07...` number is
  normalized to `2547...`; see `formatFluxPhone()` in `src/lib/fluxpay.ts`).
- `idempotencyKey` → sent as the `X-Idempotency-Key` header. Re-sending the
  same key cannot double-charge. **Use your order/booking id as the key** and
  create that record *before* the push (`src/app/api/mpesa/stk-push/route.ts`
  does exactly this).
- `reference` — short human reference (optional).
- `description` — free text (optional).

Successful response (envelope `{ success, message, data }`):

```json
{ "success": true, "message": "...", "data": { "checkoutRequestId": "ws_CO_..." } }
```

Save `checkoutRequestId` against your order — it is how you correlate
webhooks and poll status.

The customer now gets the M-Pesa PIN prompt. Your UI should show a spinner
and wait for either (a) the webhook, or (b) polled status (below).

## 4. Register a webhook

`POST /api/v1/webhooks`

```bash
curl -X POST https://fluxpay-backend.onrender.com/api/v1/webhooks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fpk_..." \
  -H "X-API-Secret: ..." \
  -d '{
      "url": "https://your-app.example.com/api/mpesa/callback",
      "name": "my-app",
      "events": ["payment.success", "payment.failed"]
    }'
```

Response returns `webhookId` and the **`webhookSecret` shown only once** —
store it as `FLUXPAY_WEBHOOK_SECRET`.

This repo ships `scripts/register-fluxpay-webhook.ts` which reads
`FLUXPAY_API_KEY/SECRET/BASE_URL` + `NEXT_PUBLIC_APP_URL` and registers the
callback at `<appUrl>/api/mpesa/callback`. Re-run it (then update
`FLUXPAY_WEBHOOK_SECRET`) any time your public origin changes.

Webhook management endpoints (all under `/api/v1/webhooks`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/webhooks` | list configured webhooks |
| POST | `/webhooks` | register (secret returned once) |
| DELETE | `/webhooks/{id}` | remove a webhook |
| POST | `/webhooks/{id}/test` | fire a `ping` event now |
| GET | `/webhooks/{id}/deliveries?limit=N` | delivery log (newest first) |
| POST | `/webhooks/{id}/replay` | redeliver the latest (or a `deliveryId`) |

## 5. Receive callbacks (the important part)

FluxPay `POST`s to your registered URL. The callback endpoint is **public**
— trust nothing until you verify the signature.

```bash
POST /api/mpesa/callback
X-Webhook-Signature: <hex HMAC-SHA256 of the raw body, signed with FLUXPAY_WEBHOOK_SECRET>
```

**Verify before parsing.** Signature is over the exact bytes received — never
re-serialize parsed JSON. Works in Node >= 18 and browsers (Web Crypto):

```ts
export async function verifyWebhookSignature(params: {
  rawBody: string | Uint8Array;
  signature: string;
  secret: string;
}): Promise<boolean> {
  const enc = new TextEncoder();
  const body =
    typeof params.rawBody === "string" ? enc.encode(params.rawBody) : params.rawBody;
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(params.secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, body as BufferSource);
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (expected.length !== params.signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ params.signature.charCodeAt(i);
  return diff === 0;
}
```

Payload shape:

```json
{
  "event": "payment.success",
  "data": {
    "checkoutRequestId": "ws_CO_...",
    "mpesaReceiptNo": "SFJ9YQ0XZ1",
    "amount": 500,
    "phoneNumber": "254712345678"
  }
}
```

Handler contract:

1. `request.text()` the body; verify the signature → `401` on mismatch.
2. Acknowledge non-payment events (`ping` etc.) with `200`. Ignore
   `payment.failed` just as surely as `payment.success`.
3. Look up your order by `data.checkoutRequestId`.
4. **Idempotency guard** — if the order is already `PAID`, return `200`
   without re-processing. FluxPay may redeliver.
5. Do synchronous, critical work in the handler (update order, mint the
   deliverable), then return `200` fast. Defer slow work (PDFs, emails) to a
   background job so the webhook handshake isn't blocked. This repo uses
   Next.js `after()`; see `src/app/api/mpesa/callback/route.ts` +
   `src/lib/fulfillment.ts`.

## 6. Reconciliation / polling fallback

Webhooks can lag or drop. Poll the status API for any order still pending:

`GET /api/v1/payments/{checkoutRequestId}`

```bash
curl -H "X-API-Key: fpk_..." -H "X-API-Secret: ..." \
  https://fluxpay-backend.onrender.com/api/v1/payments/ws_CO_...
```

Envelope `data.status` values:

| Status | Meaning |
|---|---|
| `SUCCESS` / `COMPLETED` | paid |
| `FAILED` / `CANCELLED` | failed |
| `PENDING` / `PROCESSING` | still waiting |

Implement the *same* fulfillment logic for both the webhook and the poll
(one shared function), and make both idempotent — a `PAID` order is a no-op.
See `fulfillFromFluxPayStatus()` in `src/lib/fulfillment.ts` and
`/api/payment-status`, which also falls back to DB status when FluxPay is
unreachable.

## 7. Optional endpoints

- `GET /api/v1/business` — credentials round-trip sanity check.
- `POST /api/v1/payments/{checkoutRequestId}/reverse` — refund a
  `SUCCESS` payment (optional `{ "initiatorName": "..." }`).
- `GET /health` — liveness probe (no auth). Use this for keepalives.

## 8. Operational notes

- **Cold starts**: the reference backend is Render **free tier**, which
  sleeps after ~15 min idle. First call after sleep can be slow/time out.
  Keep it warm with an external cron hitting `/health` every ~8 min, and know
  that STK pushes into a cold box may need a client retry (safe with
  `X-Idempotency-Key`).
- **Never trust client input**: amounts, receipt numbers, and QR/ticket
  validity are all server-side.
- **Field formats**: phone normalization and the `{ success, message, data }`
  envelope are defined once in `src/lib/fluxpay.ts` + `src/lib/fluxpay/sdk.ts`;
  keep gateway I/O isolated from your domain code.