import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendTicketEmail(params: {
  to: string;
  attendeeName: string;
  eventName: string;
  pdfBuffer: Buffer;
}) {
  const client = getResendClient();
  if (!client || !process.env.EMAIL_FROM) {
    return;
  }

  await client.emails.send({
    from: process.env.EMAIL_FROM,
    to: params.to,
    subject: `Your ticket for ${params.eventName}`,
    html: `<p>Hi ${params.attendeeName},</p><p>Your ticket is attached.</p>`,
    attachments: [
      {
        filename: "ticket.pdf",
        content: Buffer.from(params.pdfBuffer).toString("base64"),
      },
    ],
  });
}
