create table if not exists public.incentive_packages (
  id text primary key,
  name text not null,
  product_price integer not null default 0,
  tier_0_to_5 integer not null default 0,
  tier_6_to_10 integer not null default 0,
  tier_11_to_14 integer not null default 0,
  tier_15_plus integer not null default 0,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_incentive_packages_updated_at on public.incentive_packages;

create trigger set_incentive_packages_updated_at
before update on public.incentive_packages
for each row
execute function public.set_updated_at();

create or replace function public.current_user_is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.sales_profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
exception
  when undefined_table then
    return false;
end;
$$;

alter table public.incentive_packages enable row level security;

drop policy if exists "Allow public read incentive packages" on public.incentive_packages;
create policy "Allow public read incentive packages"
on public.incentive_packages
for select
to public
using (true);

drop policy if exists "Allow public write incentive packages" on public.incentive_packages;
drop policy if exists "Admins can write incentive packages" on public.incentive_packages;
create policy "Admins can write incentive packages"
on public.incentive_packages
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
