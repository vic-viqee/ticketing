import { getMpesaAccessToken } from "./auth";
import { buildMpesaHeaders, getMpesaBaseUrl, getMpesaShortcode } from "./config";

export interface StkPushRequest {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl?: string;
}

export async function initiateStkPush({
  phone,
  amount,
  accountReference,
  transactionDesc,
  callbackUrl,
}: StkPushRequest) {
  const token = await getMpesaAccessToken();
  const base = getMpesaBaseUrl();
  const shortcode = getMpesaShortcode();

  const formattedPhone = formatPhone(phone);

  const response = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: buildMpesaHeaders(token),
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: generatePassword(shortcode),
      Timestamp: new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14),
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`M-Pesa STK Push failed: ${response.status} ${text}`);
  }

  return response.json();
}

function formatPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `254${cleaned.slice(1)}`;
  }
  return cleaned;
}

function generatePassword(shortcode: string) {
  const passkey = process.env.MPESA_PASSKEY ?? "";
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}
