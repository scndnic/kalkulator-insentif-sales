-- Security hardening patch.
-- Run this after the main schema files have been applied.
-- It does not delete application data.

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sales_profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.current_user_is_admin() then
    new.id = old.id;
    new.role = old.role;
    new.is_active = old.is_active;
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.sales_profiles (id, name, sales_code, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1),
      'Sales'
    ),
    nullif(new.raw_user_meta_data ->> 'sales_code', ''),
    'sales'
  )
  on conflict (id) do update
  set
    name = excluded.name,
    sales_code = coalesce(public.sales_profiles.sales_code, excluded.sales_code),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists prevent_profile_privilege_escalation on public.sales_profiles;
create trigger prevent_profile_privilege_escalation
before update on public.sales_profiles
for each row execute function public.prevent_profile_privilege_escalation();

alter table public.incentive_packages enable row level security;
drop policy if exists "Allow public write incentive packages" on public.incentive_packages;
drop policy if exists "Admins can write incentive packages" on public.incentive_packages;
create policy "Admins can write incentive packages"
on public.incentive_packages
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

alter table public.upress_package_rates enable row level security;
drop policy if exists "Allow public write upress package rates" on public.upress_package_rates;
drop policy if exists "Admins can write upress package rates" on public.upress_package_rates;
create policy "Admins can write upress package rates"
on public.upress_package_rates
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Sales can update own profile" on public.sales_profiles;
create policy "Sales can update own profile"
on public.sales_profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Authenticated users can create periods" on public.periods;
create policy "Authenticated users can create periods"
on public.periods for insert
to authenticated
with check (
  status = 'open'
  and id = to_char(make_date(year, month, 1), 'YYYY-MM')
  and quarter = (((month - 1) / 3) + 1)
);
