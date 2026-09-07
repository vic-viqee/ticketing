import { getMpesaConsumerKey, getMpesaConsumerSecret, getMpesaBaseUrl } from "./config";

export async function getMpesaAccessToken() {
  const key = getMpesaConsumerKey();
  const secret = getMpesaConsumerSecret();
  const base = getMpesaBaseUrl();

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const response = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get M-Pesa access token");
  }

  const data = await response.json();
  return data.access_token as string;
}
