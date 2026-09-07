const MPESA_BASE =
  process.env.MPESA_ENV === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export function buildMpesaHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export function getMpesaBaseUrl() {
  return MPESA_BASE;
}

export function getMpesaShortcode() {
  return process.env.MPESA_SHORTCODE ?? "";
}

export function getMpesaPasskey() {
  return process.env.MPESA_PASSKEY ?? "";
}

export function getMpesaConsumerKey() {
  return process.env.MPESA_CONSUMER_KEY ?? "";
}

export function getMpesaConsumerSecret() {
  return process.env.MPESA_CONSUMER_SECRET ?? "";
}
