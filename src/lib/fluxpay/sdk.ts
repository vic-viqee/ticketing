/** FluxPay API error returned by the gateway. */
export interface FluxPayRequestError {
  detail?: string;
  message?: string;
}

/** Uniform response envelope from FluxPay. */
export interface Envelope {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface FluxConfig {
  /** API key (fpk_...). */
  apiKey: string;
  /** API secret (shown once at creation). */
  apiSecret: string;
  /** Root URL without path, e.g. https://fluxpay-backend.onrender.com. */
  baseURL?: string;
}

export interface InitiatePaymentRequest {
  amount: number;
  phoneNumber: string;
  reference?: string;
  description?: string;
  /** Stable value to dedupe retries (X-Idempotency-Key). */
  idempotencyKey?: string;
}

export interface RegisterWebhookRequest {
  url: string;
  name?: string;
  events?: string[];
}

export const DEFAULT_BASE_URL = "https://fluxpay-backend.onrender.com";
const API_PREFIX = "/api/v1";

async function request(
  config: FluxConfig,
  path: string,
  init: RequestInit = {},
  idempotencyKey?: string,
): Promise<Envelope> {
  const base = (config.baseURL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": config.apiKey,
    "X-API-Secret": config.apiSecret,
    ...(init.headers as Record<string, string> | undefined),
  };
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;
  headers.Accept = "application/json";

  const res = await fetch(`${base}${API_PREFIX}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail: string | undefined;
    try {
      const body = (await res.json()) as FluxPayRequestError;
      detail = body.detail ?? body.message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail ?? `FluxPay request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as Envelope;
}

/** POST /payments — STK push. Set idempotencyKey to safely retry. */
export function initiatePayment(
  config: FluxConfig,
  req: InitiatePaymentRequest,
): Promise<Envelope> {
  return request(
    config,
    "/payments",
    {
      method: "POST",
      body: JSON.stringify({
        amount: req.amount,
        phoneNumber: req.phoneNumber,
        reference: req.reference,
        description: req.description,
      }),
    },
    req.idempotencyKey,
  );
}

/** GET /payments/{checkoutRequestId} — current status of a payment. */
export function getPaymentStatus(
  config: FluxConfig,
  checkoutRequestId: string,
): Promise<Envelope> {
  return request(config, `/payments/${encodeURIComponent(checkoutRequestId)}`);
}

/** POST /payments/{checkoutRequestId}/reverse — refund a SUCCESS payment. */
export function reversePayment(
  config: FluxConfig,
  checkoutRequestId: string,
  initiatorName?: string,
): Promise<Envelope> {
  return request(config, `/payments/${encodeURIComponent(checkoutRequestId)}/reverse`, {
    method: "POST",
    body: JSON.stringify({ initiatorName }),
  });
}

/** POST /webhooks — register a webhook; returns the signing secret once. */
export function registerWebhook(
  config: FluxConfig,
  req: RegisterWebhookRequest,
): Promise<Envelope> {
  return request(config, "/webhooks", {
    method: "POST",
    body: JSON.stringify({
      url: req.url,
      name: req.name,
      events: req.events,
    }),
  });
}

/** GET /webhooks — list configured webhooks. */
export function listWebhooks(config: FluxConfig): Promise<Envelope> {
  return request(config, "/webhooks");
}

/** DELETE /webhooks/{webhookId}. */
export function deleteWebhook(
  config: FluxConfig,
  webhookId: string,
): Promise<Envelope> {
  return request(config, `/webhooks/${encodeURIComponent(webhookId)}`, {
    method: "DELETE",
  });
}

/** POST /webhooks/{webhookId}/test — send a "ping" event now. */
export function testWebhook(
  config: FluxConfig,
  webhookId: string,
): Promise<Envelope> {
  return request(config, `/webhooks/${encodeURIComponent(webhookId)}/test`, {
    method: "POST",
    body: "{}",
  });
}

/** GET /webhooks/{webhookId}/deliveries?limit= — delivery log, newest first. */
export function listWebhookDeliveries(
  config: FluxConfig,
  webhookId: string,
  limit = 20,
): Promise<Envelope> {
  return request(
    config,
    `/webhooks/${encodeURIComponent(webhookId)}/deliveries?limit=${limit}`,
  );
}

/** POST /webhooks/{webhookId}/replay — redeliver latest (or a specific delivery). */
export function replayWebhook(
  config: FluxConfig,
  webhookId: string,
  deliveryId?: string,
): Promise<Envelope> {
  return request(
    config,
    `/webhooks/${encodeURIComponent(webhookId)}/replay`,
    {
      method: "POST",
      body: JSON.stringify({ deliveryId }),
    },
  );
}

/** GET /webhooks: verify credentials round-trip. */
export function getBusiness(config: FluxConfig): Promise<Envelope> {
  return request(config, "/business");
}

/** GET /health — keep-alive / liveness probe. */
export function ping(config: FluxConfig): Promise<Response> {
  const base = (config.baseURL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  return fetch(`${base}/health`);
}

/**
 * Verify a FluxPay webhook signature (HMAC-SHA256 over the raw body, hex).
 * Raw body must be the exact bytes received — do not re-serialize parsed JSON.
 * Uses Web Crypto, so it works in browsers and Node >= 18.
 */
export async function verifyWebhookSignature(params: {
  rawBody: string | Uint8Array;
  signature: string;
  secret: string;
}): Promise<boolean> {
  const enc = new TextEncoder();
  const body =
    typeof params.rawBody === "string" ? enc.encode(params.rawBody) : params.rawBody;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(params.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, body as BufferSource);
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (expected.length !== params.signature.length) return false;

  // Constant-time comparison.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ params.signature.charCodeAt(i);
  }
  return diff === 0;
}