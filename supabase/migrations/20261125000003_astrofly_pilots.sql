-- "Flyer" in the brief means the person who flies the drone, not an event poster.
-- Customers either bring their own pilot or ask us to match one (extra fee).
alter table public.astrofly_bookings
  add column if not exists needs_pilot boolean not null default false,
  add column if not exists pilot_fee integer not null default 0 check (pilot_fee >= 0),
  add column if not exists pilot_name text,
  add column if not exists pilot_phone text;

comment on column public.astrofly_bookings.has_flyer is 'Unused. Kept for old rows; the poster upload was removed.';
