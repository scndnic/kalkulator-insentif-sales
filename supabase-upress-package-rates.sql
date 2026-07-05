create table if not exists public.upress_package_rates (
  package_id text primary key references public.incentive_packages(id) on delete cascade,
  tier_10 integer not null default 0 check (tier_10 >= 0),
  tier_15 integer not null default 0 check (tier_15 >= 0),
  tier_20 integer not null default 0 check (tier_20 >= 0),
  tier_25 integer not null default 0 check (tier_25 >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_upress_package_rates_updated_at on public.upress_package_rates;
create trigger set_upress_package_rates_updated_at
before update on public.upress_package_rates
for each row execute function public.set_updated_at();

alter table public.upress_package_rates enable row level security;

drop policy if exists "Allow public read upress package rates" on public.upress_package_rates;
create policy "Allow public read upress package rates"
on public.upress_package_rates
for select
using (true);

drop policy if exists "Allow public write upress package rates" on public.upress_package_rates;
create policy "Allow public write upress package rates"
on public.upress_package_rates
for all
using (true)
with check (true);
