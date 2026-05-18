create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  url text not null,
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists links_slug_idx on public.links (slug);

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
