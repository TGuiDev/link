create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  slug text not null unique,
  url text not null,
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.links
add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists links_slug_idx on public.links (slug);
create index if not exists links_user_id_idx on public.links (user_id);

create table if not exists public.link_click_events (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links (id) on delete cascade,
  country text,
  region text,
  city text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists link_click_events_link_id_idx on public.link_click_events (link_id);
create index if not exists link_click_events_created_at_idx on public.link_click_events (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists links_set_updated_at on public.links;
create trigger links_set_updated_at
before update on public.links
for each row
execute function public.set_updated_at();

create or replace function public.increment_link_clicks(link_slug text)
returns void
language sql
as $$
  update public.links
  set clicks = clicks + 1
  where slug = link_slug;
$$;

alter table public.links enable row level security;
alter table public.link_click_events enable row level security;

drop policy if exists "Links can be read by service role only" on public.links;
drop policy if exists "Links can be inserted by service role only" on public.links;
drop policy if exists "Links can be updated by service role only" on public.links;
drop policy if exists "Link events can be read by service role only" on public.link_click_events;
drop policy if exists "Link events can be inserted by service role only" on public.link_click_events;

create policy "Links can be read by service role only"
on public.links
for select
using (false);

create policy "Links can be inserted by service role only"
on public.links
for insert
with check (false);

create policy "Links can be updated by service role only"
on public.links
for update
using (false);

create policy "Link events can be read by service role only"
on public.link_click_events
for select
using (false);

create policy "Link events can be inserted by service role only"
on public.link_click_events
for insert
with check (false);
