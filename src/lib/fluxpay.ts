import { DEFAULT_BASE_URL, type FluxConfig } from "@/lib/fluxpay/sdk";

export function getFluxConfig(): FluxConfig {
  return {
    apiKey: process.env.FLUXPAY_API_KEY ?? "",
    apiSecret: process.env.FLUXPAY_API_SECRET ?? "",
    baseURL: process.env.FLUXPAY_BASE_URL || DEFAULT_BASE_URL,
  };
}

export function getFluxWebhookSecret() {
  return process.env.FLUXPAY_WEBHOOK_SECRET ?? "";
}

export function formatFluxPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `254${cleaned.slice(1)}`;
  }
  return cleaned;
}