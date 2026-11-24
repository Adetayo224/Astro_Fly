-- Dashboard settings (prices) and new booking alerts for the team.
-- Only astrofly_ objects are created or changed; the database is shared with other Samfred apps.

create table if not exists public.astrofly_settings (
  id smallint primary key default 1 check (id = 1),
  deposit_ngn integer not null default 20000 check (deposit_ngn between 0 and 10000000),
  pilot_fee_ngn integer not null default 10000 check (pilot_fee_ngn between 0 and 10000000),
  updated_by text,
  updated_at timestamptz not null default now()
);
insert into public.astrofly_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists astrofly_settings_touch on public.astrofly_settings;
create trigger astrofly_settings_touch before update on public.astrofly_settings
  for each row execute function public.astrofly_touch_updated_at();

alter table public.astrofly_settings enable row level security;
create policy "astrofly settings are public" on public.astrofly_settings
  for select to anon, authenticated using (true);

-- Each team member chooses whether new bookings email them
alter table public.astrofly_team
  add column if not exists notify_email boolean not null default true;

-- Phone and browser alerts (Web Push). One row per device.
create table if not exists public.astrofly_push_subscriptions (
  endpoint text primary key,
  email text not null references public.astrofly_team (email) on delete cascade,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists astrofly_push_subscriptions_email_idx on public.astrofly_push_subscriptions (email);
alter table public.astrofly_push_subscriptions enable row level security;
-- No policies: only the server (service role) reads or writes push subscriptions.
