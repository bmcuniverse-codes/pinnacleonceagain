-- VoteWave Supabase Schema - Organization/Multi-Event Edition
-- Run this inside Supabase SQL Editor.
-- If you already ran the old schema, use a fresh Supabase project while developing.

create extension if not exists "uuid-ossp";

create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  brand_primary text default '#050816',
  brand_accent text default '#f5c542',
  contact_email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  slug text not null,
  description text,
  cover_url text,
  vote_price integer not null default 50 check (vote_price > 0),
  voting_open boolean not null default true,
  show_leaderboard boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(organization_id, slug)
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  name text not null,
  slug text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(event_id, slug)
);

create table if not exists public.nominees (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  full_name text not null,
  nickname text,
  level text check (level in ('100','200','300','400','500','ND1','ND2','HND1','HND2','Other')) default '100',
  image_url text,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.nominations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  nominee_id uuid references public.nominees(id) on delete cascade not null,
  slug text unique not null,
  total_votes integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(category_id, nominee_id)
);

create table if not exists public.vote_transactions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete restrict not null,
  event_id uuid references public.events(id) on delete restrict not null,
  category_id uuid references public.categories(id) on delete restrict not null,
  nominee_id uuid references public.nominees(id) on delete restrict not null,
  nomination_id uuid references public.nominations(id) on delete restrict not null,
  votes integer not null check (votes > 0),
  amount integer not null check (amount > 0),
  payment_reference text unique not null,
  access_code text,
  provider text not null default 'paystack',
  payment_status text not null default 'pending' check (payment_status in ('pending','success','failed','abandoned')),
  generated_email text not null,
  supporter_name text,
  supporter_message text,
  voter_phone text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Public view hides exact total_votes by exposing public_score only for progress bars.
create or replace view public.nominations_public as
select
  n.id,
  n.slug,
  n.organization_id,
  n.event_id,
  n.category_id,
  n.nominee_id,
  n.is_active,
  org.name as organization_name,
  org.slug as organization_slug,
  org.logo_url as organization_logo_url,
  org.brand_primary,
  org.brand_accent,
  e.name as event_name,
  e.slug as event_slug,
  e.vote_price,
  e.voting_open,
  e.show_leaderboard,
  e.ends_at,
  c.name as category_name,
  c.slug as category_slug,
  m.full_name,
  m.nickname,
  m.level,
  m.image_url,
  m.bio,
  case when e.show_leaderboard then n.total_votes else 0 end as public_score
from public.nominations n
join public.organizations org on org.id = n.organization_id
join public.events e on e.id = n.event_id
join public.categories c on c.id = n.category_id
join public.nominees m on m.id = n.nominee_id
where org.is_active = true and e.is_active = true and c.is_active = true and m.is_active = true and n.is_active = true;

-- Function to safely mark a transaction successful and increment votes once.
create or replace function public.confirm_vote_transaction(ref text, payload jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
as $$
declare
  tx record;
begin
  select * into tx from public.vote_transactions where payment_reference = ref for update;
  if not found then
    raise exception 'Transaction not found: %', ref;
  end if;

  if tx.payment_status = 'success' then
    return;
  end if;

  update public.vote_transactions
  set payment_status = 'success', verified_at = now(), raw_response = payload
  where id = tx.id;

  update public.nominations
  set total_votes = total_votes + tx.votes
  where id = tx.nomination_id;

  insert into public.activity_logs(organization_id, action, entity, entity_id, metadata)
  values(tx.organization_id, 'vote_confirmed', 'vote_transactions', tx.id, jsonb_build_object('reference', ref, 'votes', tx.votes, 'amount', tx.amount));
end;
$$;

alter table public.organizations enable row level security;
alter table public.events enable row level security;
alter table public.categories enable row level security;
alter table public.nominees enable row level security;
alter table public.nominations enable row level security;
alter table public.vote_transactions enable row level security;
alter table public.activity_logs enable row level security;

-- Public read policies
create policy "Public can read active organizations" on public.organizations for select using (is_active = true);
create policy "Public can read active events" on public.events for select using (is_active = true);
create policy "Public can read active categories" on public.categories for select using (is_active = true);
create policy "Public can read active nominees" on public.nominees for select using (is_active = true);
create policy "Public can read active nominations" on public.nominations for select using (is_active = true);

-- Authenticated admin users can manage rows in this starter.
-- Production upgrade: replace this with organization_members role policies.
create policy "Authenticated can manage organizations" on public.organizations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated can manage events" on public.events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated can manage categories" on public.categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated can manage nominees" on public.nominees for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated can manage nominations" on public.nominations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated can read transactions" on public.vote_transactions for select using (auth.role() = 'authenticated');
create policy "Authenticated can read logs" on public.activity_logs for select using (auth.role() = 'authenticated');

-- Sample data. Delete or edit later.
insert into public.organizations(name, slug, description) values
('VoteWave Demo Organization', 'votewave-demo', 'Demo organization for multi-event voting.')
on conflict(slug) do nothing;

insert into public.events(organization_id, name, slug, description, vote_price)
select id, 'Campus Choice Awards 2026', 'campus-choice-awards-2026', 'A premium voting experience for recognizing outstanding students.', 50
from public.organizations where slug='votewave-demo'
on conflict(organization_id, slug) do nothing;

insert into public.categories(organization_id, event_id, name, slug, description)
select e.organization_id, e.id, 'Most Popular Student', 'most-popular-student', 'For the most recognized student on campus.' from public.events e where e.slug='campus-choice-awards-2026'
on conflict(event_id, slug) do nothing;

insert into public.categories(organization_id, event_id, name, slug, description)
select e.organization_id, e.id, 'Best Dressed', 'best-dressed', 'For the most stylish student.' from public.events e where e.slug='campus-choice-awards-2026'
on conflict(event_id, slug) do nothing;

insert into public.nominees(organization_id, full_name, nickname, level, bio, image_url)
select id, 'Adewale Johnson', 'AJ Classic', '400', 'Confident, stylish and loved by many students.', null from public.organizations where slug='votewave-demo';
insert into public.nominees(organization_id, full_name, nickname, level, bio, image_url)
select id, 'Mariam Bello', 'Mimi Gold', '300', 'Energetic, brilliant and influential.', null from public.organizations where slug='votewave-demo';
insert into public.nominees(organization_id, full_name, nickname, level, bio, image_url)
select id, 'Daniel Okafor', 'D-King', '200', 'Creative, social and highly talented.', null from public.organizations where slug='votewave-demo';

insert into public.nominations(organization_id, event_id, category_id, nominee_id, slug)
select e.organization_id, e.id, c.id, m.id, 'aj-classic-most-popular-student'
from public.events e, public.categories c, public.nominees m
where e.slug='campus-choice-awards-2026' and c.slug='most-popular-student' and m.nickname='AJ Classic'
on conflict do nothing;

insert into public.nominations(organization_id, event_id, category_id, nominee_id, slug)
select e.organization_id, e.id, c.id, m.id, 'mimi-gold-most-popular-student'
from public.events e, public.categories c, public.nominees m
where e.slug='campus-choice-awards-2026' and c.slug='most-popular-student' and m.nickname='Mimi Gold'
on conflict do nothing;

insert into public.nominations(organization_id, event_id, category_id, nominee_id, slug)
select e.organization_id, e.id, c.id, m.id, 'd-king-best-dressed'
from public.events e, public.categories c, public.nominees m
where e.slug='campus-choice-awards-2026' and c.slug='best-dressed' and m.nickname='D-King'
on conflict do nothing;
