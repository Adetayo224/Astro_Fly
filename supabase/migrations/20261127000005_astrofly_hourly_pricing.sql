-- Full day and hourly prices, editable in the dashboard Settings.
alter table public.astrofly_settings
  add column if not exists full_day_ngn integer not null default 50000 check (full_day_ngn between 0 and 100000000),
  add column if not exists hourly_ngn integer not null default 5000 check (hourly_ngn between 0 and 100000000),
  add column if not exists min_hours integer not null default 4 check (min_hours between 1 and 24);
