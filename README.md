# Kenyan Events Ticketing Platform

MVP event ticketing web app for the Kenyan market. Browse events, purchase tickets via M-Pesa, receive PDF tickets with QR codes, and check in at events.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React + shadcn/ui + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js (Credentials + Google providers)
- **Payments**: FluxPay gateway (M-Pesa STK Push + signed webhook + polling)
- **Email**: Resend / Nodemailer (PDF ticket delivery)
- **QR Codes**: `qrcode` library (server-side generation)
- **PDFs**: `@react-pdf/renderer` or `pdfkit`
- **Storage**: Local filesystem (`/public/uploads`) for v1

## User Roles

1. **Attendee** — browse events, purchase tickets, receive PDF/QR tickets via email, view tickets in dashboard
2. **Organizer** — register, pending admin approval, create events with ticket tiers, upload event image, manage attendees, view basic sales stats, scan QR codes at event entry
3. **Admin** — approve/reject organizer registrations, manage platform

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or managed, e.g., Supabase, Neon)
- FluxPay gateway account (API key + secret, webhook secret for dev)
- Resend API key (for email delivery)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Environment Variables

See `.env.example` for required variables:
- Database connection (`DATABASE_URL`)
- NextAuth secret and providers (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- FluxPay gateway (`FLUXPAY_API_KEY`, `FLUXPAY_API_SECRET`, `FLUXPAY_BASE_URL`, `FLUXPAY_WEBHOOK_SECRET`)
- Email service (`RESEND_API_KEY`, `EMAIL_FROM`)

## Project Structure

```
app/                  # Next.js App Router pages
  api/                # API routes
  dashboard/          # Authenticated dashboard pages
  events/             # Public event pages
  admin/              # Admin pages
components/           # Reusable UI components
lib/                  # Utilities, helpers, Prisma client
prisma/               # Prisma schema and migrations
public/               # Static assets and uploads
```

## API Routes

### Public
- `GET /api/events` — list events (search/filter)
- `GET /api/events/[slug]` — event detail

### Auth
- `POST /api/auth/register` — email/password signup
- `POST /api/auth/login` — email/password login
- `GET /api/auth/google` — Google OAuth (NextAuth)

### Organizer
- `POST /api/events` — create event
- `PUT /api/events/[id]` — update event
- `POST /api/events/[id]/tiers` — add ticket tier
- `GET /api/organizer/events` — my events
- `GET /api/organizer/events/[id]/attendees` — attendee list + stats
- `POST /api/organizer/events/[id]/check-in` — scan QR / validate ticket

### Payment
- `POST /api/mpesa/stk-push` — initiate STK Push
- `POST /api/mpesa/callback` — Safaricom webhook
- `GET /api/payment-status` — poll payment status

### Admin
- `GET /api/admin/pending-organizers` — list pending
- `POST /api/admin/organizers/[id]/approve` — approve
- `POST /api/admin/organizers/[id]/reject` — reject

## Deployment

- Deploy on Vercel or any Node.js host
- Must expose public HTTPS URL for the FluxPay webhook (`/api/mpesa/callback`; use ngrok or a tunnel for dev)
- Database: Supabase Postgres, Neon, or any managed Postgres
- Configure FluxPay credentials in production environment (register the webhook via `npm run webhook:register`)

## License

Private — All rights reserved.
