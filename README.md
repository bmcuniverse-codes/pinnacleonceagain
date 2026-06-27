# VoteWave Platform - Supabase Multi-Event Paid Voting System

VoteWave is a premium, mobile-first paid voting platform for campus awards, pageants, churches, brands, departments, organizations and event managers.

This version uses a scalable structure:

```text
Organizations → Events → Categories → Nominees → Nominations → Payments/Votes
```

A nominee can appear in more than one category, and every nomination has its own unique voting link.

## Stack

- React + Vite
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Edge Functions
- Supabase Storage-ready image URLs
- Paystack payment initialization + webhook confirmation
- Vercel-ready frontend

## Key Features Included

- Mobile-first premium UI
- Public events page
- Categories page
- Nominee listings
- Dedicated nominee profile/voting page
- Nominee picture support
- Nickname and school level support
- Amount-based voting: voter enters amount, system calculates votes
- No voter email field shown
- Unique hidden generated Paystack email per transaction
- Optional supporter name
- Optional supporter message
- Paystack Edge Function for payment initialization
- Paystack webhook Edge Function for confirmed vote update
- Public leaderboard with progress bars only, no exact public vote totals
- Admin login
- Admin dashboard overview
- Supabase SQL schema with organizations, events, categories, nominees, nominations, transactions and activity logs

## Important Product Decision

Voters do not need to enter email. Paystack requires an email internally, so the Edge Function generates one automatically:

```text
vote-vwxxxxxxxx@votewave.local
```

This keeps the voting page simple while maintaining clean transaction tracking.

## Setup

### 1. Install frontend

```bash
cd frontend
npm install
```

### 2. Create frontend environment file

Copy:

```bash
cp .env.example .env
```

Fill:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Create Supabase database tables

Open Supabase Dashboard → SQL Editor.

Run:

```text
supabase/sql/schema.sql
```

Use a fresh Supabase project if you previously ran the old non-organization schema.

### 4. Set Supabase Edge Function secrets

In your Supabase project, set these secrets:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxx
FRONTEND_URL=http://localhost:5173
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret
```

### 5. Deploy Supabase functions

Install Supabase CLI, then from project root:

```bash
supabase functions deploy initialize-payment
supabase functions deploy paystack-webhook
```

### 6. Configure Paystack webhook

In Paystack Dashboard, add your webhook URL:

```text
https://your-project.supabase.co/functions/v1/paystack-webhook
```

### 7. Start frontend

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

## Voting Flow

1. Voter opens a nominee voting link.
2. Voter enters amount, for example ₦500.
3. System calculates votes using event vote price, for example ₦50 per vote = 10 votes.
4. Voter pays with Paystack.
5. Paystack sends webhook to Supabase Edge Function.
6. Edge Function confirms transaction once.
7. Vote count updates automatically.
8. Public leaderboard progress bar updates.
9. Admin sees exact vote numbers and transactions.

## Admin Setup

Create an admin user in Supabase Authentication.

Then visit:

```text
/admin/login
```

For this starter, authenticated users can manage data through Supabase Table Editor. The next production upgrade should add a complete CRUD admin UI.

## Recommended Next Production Upgrades

- Full CRUD admin pages inside the app
- Supabase Storage image upload from admin dashboard
- QR code generation for each nominee voting link
- CSV/PDF export
- Realtime leaderboard subscription
- Organization member roles and stronger RLS policies
- Event branding editor
- Voting countdown timer
- Winner certificate generation

## Notes

This starter is intentionally structured like a platform, not a one-off website. One codebase can host many organizations and events.
