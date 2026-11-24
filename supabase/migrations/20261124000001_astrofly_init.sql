-- Astro_Fly schema.
-- This project shares a Supabase database with other Samfred Robotics apps, so every object
-- here is prefixed with astrofly_ and nothing existing is replaced or altered.

-- Team (who may open /admin) ---------------------------------------------------
create table if not exists public.astrofly_team (
  email text primary key check (email = lower(email)),
  role text not null default 'admin' check (role in ('owner', 'admin')),
  invited_by text,
  created_at timestamptz not null default now()
);

create function public.astrofly_is_team()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.astrofly_team t
    where t.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create function public.astrofly_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Drones -----------------------------------------------------------------------
create table if not exists public.astrofly_drones (
  id text primary key,
  slug text unique not null,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  status text not null default 'coming_soon' check (status in ('available', 'coming_soon')),
  category text not null default 'compact' check (category in ('compact', 'pro', 'cinema', 'fpv', 'selfie')),
  image text not null,
  weight text not null default '',
  flight_time text not null default '',
  camera text not null default '',
  video text not null default '',
  range text not null default '',
  sensing text not null default '',
  best_for text[] not null default '{}',
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bookings ---------------------------------------------------------------------
create table if not exists public.astrofly_bookings (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null check (reference ~ '^AF[0-9]{4}[A-Z0-9]{4}$'),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'paid', 'completed', 'cancelled')),

  full_name text not null,
  email text not null,
  phone text not null,
  whatsapp text not null,

  event_type text not null,
  event_date date not null,
  start_time text not null,
  duration text not null,
  custom_duration text,
  venue_name text not null,
  address text not null,
  city text not null,
  state text not null,
  setting text not null check (setting in ('indoor', 'outdoor', 'both')),
  guests text not null,

  drone_slug text not null references public.astrofly_drones (slug) on update cascade,
  drone_name text not null,
  deliverables text[] not null default '{}',
  has_flyer boolean not null default false,
  flyer_path text,
  flyer_name text,
  design_flyer boolean not null default false,
  flyer_details text,
  notes text,

  pay_option text not null default 'later' check (pay_option in ('deposit', 'later')),
  price integer check (price is null or price >= 0),
  amount_paid integer not null default 0,
  payment_reference text,
  admin_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists astrofly_bookings_status_idx on public.astrofly_bookings (status);
create index if not exists astrofly_bookings_event_date_idx on public.astrofly_bookings (event_date);
create index if not exists astrofly_bookings_email_idx on public.astrofly_bookings (lower(email));

-- Status history and notes -------------------------------------------------------
create table if not exists public.astrofly_booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.astrofly_bookings (id) on delete cascade,
  status text not null check (status in ('pending', 'confirmed', 'paid', 'completed', 'cancelled')),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists astrofly_booking_events_booking_idx on public.astrofly_booking_events (booking_id, created_at);

-- Notify me --------------------------------------------------------------------
create table if not exists public.astrofly_notify_me (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  drone_slug text not null references public.astrofly_drones (slug) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (email, drone_slug)
);

create trigger astrofly_bookings_touch before update on public.astrofly_bookings
  for each row execute function public.astrofly_touch_updated_at();
create trigger astrofly_drones_touch before update on public.astrofly_drones
  for each row execute function public.astrofly_touch_updated_at();

-- Row Level Security -----------------------------------------------------------------
-- The app writes through server routes with the service role key (which bypasses RLS)
-- and checks access itself. These policies lock the tables for everyone else.
alter table public.astrofly_team enable row level security;
alter table public.astrofly_drones enable row level security;
alter table public.astrofly_bookings enable row level security;
alter table public.astrofly_booking_events enable row level security;
alter table public.astrofly_notify_me enable row level security;

create policy "astrofly team reads team" on public.astrofly_team
  for select to authenticated using (public.astrofly_is_team());

create policy "astrofly drones are public" on public.astrofly_drones
  for select to anon, authenticated using (true);
create policy "astrofly team manages drones" on public.astrofly_drones
  for all to authenticated using (public.astrofly_is_team()) with check (public.astrofly_is_team());

create policy "astrofly team reads bookings" on public.astrofly_bookings
  for select to authenticated using (public.astrofly_is_team());
create policy "astrofly team updates bookings" on public.astrofly_bookings
  for update to authenticated using (public.astrofly_is_team()) with check (public.astrofly_is_team());

create policy "astrofly team reads events" on public.astrofly_booking_events
  for select to authenticated using (public.astrofly_is_team());
create policy "astrofly team writes events" on public.astrofly_booking_events
  for insert to authenticated with check (public.astrofly_is_team());

create policy "astrofly anyone can subscribe" on public.astrofly_notify_me
  for insert to anon, authenticated with check (true);
create policy "astrofly team reads notify" on public.astrofly_notify_me
  for select to authenticated using (public.astrofly_is_team());

-- Storage: private flyers bucket ---------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('astrofly-flyers', 'astrofly-flyers', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;

create policy "astrofly flyers read team" on storage.objects
  for select to authenticated using (bucket_id = 'astrofly-flyers' and public.astrofly_is_team());

-- First owner -------------------------------------------------------------------------
insert into public.astrofly_team (email, role, invited_by)
values ('orders@samfredrobotics.com', 'owner', 'setup')
on conflict (email) do nothing;
