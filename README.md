# VoteWave - A Pinnacle Platform - Supabase Multi-Event Paid Voting System

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
