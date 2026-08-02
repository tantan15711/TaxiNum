create extension if not exists "pgcrypto";

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  public_slug text not null unique,
  display_name text not null default 'Taxista',
  avatar_url text,
  transfer_number text not null default '',
  phone_number text not null default '',
  show_phone boolean not null default false,
  is_public boolean not null default true,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drivers_public_slug_format check (public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

alter table public.drivers enable row level security;

drop policy if exists "drivers can read their own profile" on public.drivers;
drop policy if exists "drivers can create their own profile" on public.drivers;
drop policy if exists "drivers can update their own profile" on public.drivers;
drop policy if exists "drivers can delete their own profile" on public.drivers;

create policy "drivers can read their own profile"
on public.drivers
for select
to authenticated
using (auth.uid() = user_id);

create policy "drivers can create their own profile"
on public.drivers
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "drivers can update their own profile"
on public.drivers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "drivers can delete their own profile"
on public.drivers
for delete
to authenticated
using (auth.uid() = user_id);

create or replace view public.driver_public_profiles as
select
  public_slug,
  display_name,
  avatar_url,
  transfer_number,
  case when show_phone then phone_number else '' end as phone_number,
  show_phone,
  is_public,
  updated_at
from public.drivers
where is_public = true;

grant select on public.driver_public_profiles to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('driver-avatars', 'driver-avatars', true)
on conflict (id) do nothing;

drop policy if exists "drivers can upload their avatar" on storage.objects;
drop policy if exists "drivers can update their avatar" on storage.objects;
drop policy if exists "driver avatars are public" on storage.objects;

create policy "drivers can upload their avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'driver-avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "drivers can update their avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'driver-avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'driver-avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "driver avatars are public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'driver-avatars');
