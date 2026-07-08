-- Growth schema for sales accounts, monthly entries, payout rules, and upress.
-- Run after reviewing policies and before enabling the new app flows.

create extension if not exists "pgcrypto";

create table if not exists public.sales_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  sales_code text unique,
  role text not null default 'sales' check (role in ('sales', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.periods (
  id text primary key,
  year integer not null,
  month integer not null check (month between 1 and 12),
  quarter integer not null check (quarter between 1 and 4),
  status text not null default 'open' check (status in ('open', 'locked', 'paid')),
  created_at timestamptz not null default now(),
  unique (year, month)
);

create table if not exists public.sales_entries (
  id uuid primary key default gen_random_uuid(),
  sales_id uuid not null references public.sales_profiles(id) on delete cascade,
  period_id text not null references public.periods(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'locked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sales_id, period_id)
);

create table if not exists public.sales_entry_items (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.sales_entries(id) on delete cascade,
  package_id text not null,
  quantity integer not null default 0 check (quantity >= 0),
  product_price integer not null default 0 check (product_price >= 0),
  package_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_id, package_id)
);

create table if not exists public.incentive_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  effective_from text not null references public.periods(id) on delete restrict,
  current_month_percentage numeric(5,2) not null default 80 check (current_month_percentage >= 0),
  deferred_percentage numeric(5,2) not null default 20 check (deferred_percentage >= 0),
  deferred_offset_months integer not null default 2 check (deferred_offset_months >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.upress_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  effective_from text not null references public.periods(id) on delete restrict,
  quarter_mode text not null default 'calendar_quarter' check (quarter_mode in ('calendar_quarter')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.upress_tiers (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.upress_rules(id) on delete cascade,
  min_sa integer not null check (min_sa >= 0),
  max_sa integer check (max_sa is null or max_sa >= min_sa),
  amount integer not null default 0 check (amount >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.upress_payout_rules (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.upress_rules(id) on delete cascade,
  quarter_month_index integer not null check (quarter_month_index between 1 and 3),
  source_month_index integer not null check (source_month_index between 1 and 3),
  percentage numeric(5,2) not null check (percentage >= 0),
  created_at timestamptz not null default now(),
  unique (rule_id, quarter_month_index, source_month_index)
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  sales_id uuid not null references public.sales_profiles(id) on delete cascade,
  period_id text not null references public.periods(id) on delete restrict,
  total_amount integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'final', 'paid')),
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sales_id, period_id)
);

create table if not exists public.payout_components (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.payouts(id) on delete cascade,
  component_type text not null,
  source_period_id text references public.periods(id) on delete restrict,
  percentage numeric(5,2),
  amount integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.periods (id, year, month, quarter)
select
  to_char(make_date(year_value, month_value, 1), 'YYYY-MM'),
  year_value,
  month_value,
  ((month_value - 1) / 3) + 1
from generate_series(2025, 2028) as years(year_value)
cross join generate_series(1, 12) as months(month_value)
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of raw_user_meta_data, email on auth.users
for each row execute function public.handle_new_user();

insert into public.sales_profiles (id, name, sales_code, role, is_active)
select
  users.id,
  coalesce(
    nullif(users.raw_user_meta_data ->> 'name', ''),
    nullif(users.raw_user_meta_data ->> 'full_name', ''),
    split_part(users.email, '@', 1),
    'Sales'
  ),
  nullif(users.raw_user_meta_data ->> 'sales_code', ''),
  'sales',
  true
from auth.users
on conflict (id) do update
set
  name = excluded.name,
  sales_code = coalesce(public.sales_profiles.sales_code, excluded.sales_code),
  updated_at = now();

drop trigger if exists set_sales_profiles_updated_at on public.sales_profiles;
create trigger set_sales_profiles_updated_at
before update on public.sales_profiles
for each row execute function public.set_updated_at();

drop trigger if exists prevent_profile_privilege_escalation on public.sales_profiles;
create trigger prevent_profile_privilege_escalation
before update on public.sales_profiles
for each row execute function public.prevent_profile_privilege_escalation();

drop trigger if exists set_sales_entries_updated_at on public.sales_entries;
create trigger set_sales_entries_updated_at
before update on public.sales_entries
for each row execute function public.set_updated_at();

drop trigger if exists set_sales_entry_items_updated_at on public.sales_entry_items;
create trigger set_sales_entry_items_updated_at
before update on public.sales_entry_items
for each row execute function public.set_updated_at();

drop trigger if exists set_incentive_rules_updated_at on public.incentive_rules;
create trigger set_incentive_rules_updated_at
before update on public.incentive_rules
for each row execute function public.set_updated_at();

drop trigger if exists set_upress_rules_updated_at on public.upress_rules;
create trigger set_upress_rules_updated_at
before update on public.upress_rules
for each row execute function public.set_updated_at();

drop trigger if exists set_upress_tiers_updated_at on public.upress_tiers;
create trigger set_upress_tiers_updated_at
before update on public.upress_tiers
for each row execute function public.set_updated_at();

drop trigger if exists set_payouts_updated_at on public.payouts;
create trigger set_payouts_updated_at
before update on public.payouts
for each row execute function public.set_updated_at();

alter table public.sales_profiles enable row level security;
alter table public.periods enable row level security;
alter table public.sales_entries enable row level security;
alter table public.sales_entry_items enable row level security;
alter table public.incentive_rules enable row level security;
alter table public.upress_rules enable row level security;
alter table public.upress_tiers enable row level security;
alter table public.upress_payout_rules enable row level security;
alter table public.payouts enable row level security;
alter table public.payout_components enable row level security;

drop policy if exists "Sales can create own profile" on public.sales_profiles;
create policy "Sales can create own profile"
on public.sales_profiles for insert
to authenticated
with check (id = auth.uid() and role = 'sales');

drop policy if exists "Sales can read own profile" on public.sales_profiles;
create policy "Sales can read own profile"
on public.sales_profiles for select
to authenticated
using (id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Sales can update own profile" on public.sales_profiles;
create policy "Sales can update own profile"
on public.sales_profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Admins can manage profiles" on public.sales_profiles;
create policy "Admins can manage profiles"
on public.sales_profiles for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Authenticated users can read periods" on public.periods;
create policy "Authenticated users can read periods"
on public.periods for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create periods" on public.periods;
create policy "Authenticated users can create periods"
on public.periods for insert
to authenticated
with check (
  status = 'open'
  and id = to_char(make_date(year, month, 1), 'YYYY-MM')
  and quarter = (((month - 1) / 3) + 1)
);

drop policy if exists "Admins can manage periods" on public.periods;
create policy "Admins can manage periods"
on public.periods for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Sales can read own entries" on public.sales_entries;
create policy "Sales can read own entries"
on public.sales_entries for select
to authenticated
using (sales_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Sales can manage own draft entries" on public.sales_entries;
create policy "Sales can manage own draft entries"
on public.sales_entries for all
to authenticated
using ((sales_id = auth.uid() and status <> 'locked') or public.current_user_is_admin())
with check ((sales_id = auth.uid() and status <> 'locked') or public.current_user_is_admin());

drop policy if exists "Sales can read own entry items" on public.sales_entry_items;
create policy "Sales can read own entry items"
on public.sales_entry_items for select
to authenticated
using (
  exists (
    select 1 from public.sales_entries
    where sales_entries.id = sales_entry_items.entry_id
      and (sales_entries.sales_id = auth.uid() or public.current_user_is_admin())
  )
);

drop policy if exists "Sales can manage own entry items" on public.sales_entry_items;
create policy "Sales can manage own entry items"
on public.sales_entry_items for all
to authenticated
using (
  exists (
    select 1 from public.sales_entries
    where sales_entries.id = sales_entry_items.entry_id
      and ((sales_entries.sales_id = auth.uid() and sales_entries.status <> 'locked') or public.current_user_is_admin())
  )
)
with check (
  exists (
    select 1 from public.sales_entries
    where sales_entries.id = sales_entry_items.entry_id
      and ((sales_entries.sales_id = auth.uid() and sales_entries.status <> 'locked') or public.current_user_is_admin())
  )
);

drop policy if exists "Authenticated users can read active rules" on public.incentive_rules;
create policy "Authenticated users can read active rules"
on public.incentive_rules for select
to authenticated
using (is_active = true or public.current_user_is_admin());

drop policy if exists "Admins can manage incentive rules" on public.incentive_rules;
create policy "Admins can manage incentive rules"
on public.incentive_rules for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Authenticated users can read upress rules" on public.upress_rules;
create policy "Authenticated users can read upress rules"
on public.upress_rules for select
to authenticated
using (is_active = true or public.current_user_is_admin());

drop policy if exists "Admins can manage upress rules" on public.upress_rules;
create policy "Admins can manage upress rules"
on public.upress_rules for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Authenticated users can read upress tiers" on public.upress_tiers;
create policy "Authenticated users can read upress tiers"
on public.upress_tiers for select
to authenticated
using (true);

drop policy if exists "Admins can manage upress tiers" on public.upress_tiers;
create policy "Admins can manage upress tiers"
on public.upress_tiers for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Authenticated users can read upress payout rules" on public.upress_payout_rules;
create policy "Authenticated users can read upress payout rules"
on public.upress_payout_rules for select
to authenticated
using (true);

drop policy if exists "Admins can manage upress payout rules" on public.upress_payout_rules;
create policy "Admins can manage upress payout rules"
on public.upress_payout_rules for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Sales can read own payouts" on public.payouts;
create policy "Sales can read own payouts"
on public.payouts for select
to authenticated
using (sales_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Admins can manage payouts" on public.payouts;
create policy "Admins can manage payouts"
on public.payouts for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Sales can read own payout components" on public.payout_components;
create policy "Sales can read own payout components"
on public.payout_components for select
to authenticated
using (
  exists (
    select 1 from public.payouts
    where payouts.id = payout_components.payout_id
      and (payouts.sales_id = auth.uid() or public.current_user_is_admin())
  )
);

drop policy if exists "Admins can manage payout components" on public.payout_components;
create policy "Admins can manage payout components"
on public.payout_components for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

insert into public.incentive_rules (
  name,
  effective_from,
  current_month_percentage,
  deferred_percentage,
  deferred_offset_months,
  is_active
)
select 'Default 80/20', '2026-01', 80, 20, 2, true
where exists (select 1 from public.periods where id = '2026-01')
  and not exists (select 1 from public.incentive_rules where name = 'Default 80/20');

with inserted_rule as (
  insert into public.upress_rules (name, effective_from, quarter_mode, is_active)
  select 'Default Triwulan', '2026-01', 'calendar_quarter', true
  where exists (select 1 from public.periods where id = '2026-01')
    and not exists (select 1 from public.upress_rules where name = 'Default Triwulan')
  returning id
),
selected_rule as (
  select id from inserted_rule
  union all
  select id from public.upress_rules where name = 'Default Triwulan'
  limit 1
)
insert into public.upress_payout_rules (
  rule_id,
  quarter_month_index,
  source_month_index,
  percentage
)
select selected_rule.id, payout_rule.quarter_month_index, payout_rule.source_month_index, payout_rule.percentage
from selected_rule
cross join (
  values
    (1, 1, 50),
    (2, 2, 50),
    (3, 1, 50),
    (3, 2, 50),
    (3, 3, 100)
) as payout_rule(quarter_month_index, source_month_index, percentage)
on conflict (rule_id, quarter_month_index, source_month_index) do nothing;
