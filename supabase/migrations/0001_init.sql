-- =====================================================================
-- Property Management Platform: Στάδιο 1
-- Τρέξε ολόκληρο αυτό το αρχείο στο Supabase > SQL Editor.
-- =====================================================================

create extension if not exists pgcrypto;

create type public.user_role as enum ('owner', 'employee');
create type public.task_status as enum ('pending', 'scheduled', 'in_progress', 'done');

-- ---------- Πίνακες ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'employee',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  area_sqm numeric,
  bedrooms int,
  bathrooms int,
  color text not null default '#0b6e7a',
  details jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.property_members (
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, property_id)
);
create index on public.property_members (property_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'other',
  status public.task_status not null default 'pending',
  is_urgent boolean not null default false,
  scheduled_for date,
  assignee_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid references public.profiles(id)
);
create index on public.tasks (property_id, status);

-- Τα οικονομικά (και το κόστος εργασιών) ζουν ΜΟΝΟ εδώ και είναι ορατά μόνο στον Owner.
create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  entry_date date not null,
  type text not null check (type in ('income', 'expense')),
  description text,
  category text,
  subcategory text,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text,
  supplier text,
  task_id uuid references public.tasks(id) on delete set null,
  is_internal boolean,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.financial_entries (property_id, entry_date);

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb
);

-- ---------- Βοηθητικές συναρτήσεις ----------
-- Για MFA: όταν ο Owner έχει ενεργοποιήσει MFA, άλλαξε το σώμα σε:
--   select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
create or replace function public.mfa_ok() returns boolean
language sql stable as $$ select true $$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner' and p.is_active
  ) and public.mfa_ok();
$$;

create or replace function public.has_property_access(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_owner() or exists (
    select 1
    from public.property_members m
    join public.profiles p on p.id = m.user_id
    where m.user_id = auth.uid() and m.property_id = pid
      and p.is_active and p.role = 'employee'
  );
$$;

-- ---------- Αυτόματη δημιουργία προφίλ (ΠΑΝΤΑ ως employee) ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Κανόνες εργασιών για υπαλλήλους ----------
create or replace function public.tasks_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_owner() then
    new.updated_at := now();
    if new.status = 'done' and old.status <> 'done' then
      new.completed_at := now(); new.completed_by := auth.uid();
    end if;
    return new;
  end if;
  if old.status = 'done' then
    raise exception 'Η ολοκληρωμένη εργασία δεν μπορεί να τροποποιηθεί χωρίς έγκριση διαχειριστή';
  end if;
  if new.property_id <> old.property_id
     or new.assignee_id is distinct from old.assignee_id
     or new.created_by is distinct from old.created_by
     or new.created_at <> old.created_at then
    raise exception 'Δεν επιτρέπεται αλλαγή ακινήτου ή υπευθύνου';
  end if;
  new.updated_at := now();
  if new.status = 'done' then
    new.completed_at := now(); new.completed_by := auth.uid();
  end if;
  return new;
end $$;
create trigger tasks_guard before update on public.tasks
  for each row execute function public.tasks_guard();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
create trigger properties_touch before update on public.properties
  for each row execute function public.touch_updated_at();

-- ---------- Audit log ----------
create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_old jsonb; v_new jsonb;
begin
  v_old := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_new := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  insert into public.audit_log (actor_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), tg_op, tg_table_name, coalesce(v_new ->> 'id', v_old ->> 'id'), v_old, v_new);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger audit_profiles after insert or update or delete on public.profiles for each row execute function public.audit_row();
create trigger audit_properties after insert or update or delete on public.properties for each row execute function public.audit_row();
create trigger audit_members after insert or update or delete on public.property_members for each row execute function public.audit_row();
create trigger audit_tasks after insert or update or delete on public.tasks for each row execute function public.audit_row();
create trigger audit_finance after insert or update or delete on public.financial_entries for each row execute function public.audit_row();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_members enable row level security;
alter table public.tasks enable row level security;
alter table public.financial_entries enable row level security;
alter table public.audit_log enable row level security;

-- profiles: ο καθένας βλέπει το δικό του, ο Owner όλα. Μόνο ο Owner τροποποιεί.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_owner());
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- properties: ανάγνωση με πρόσβαση, αλλαγές μόνο Owner
create policy properties_select on public.properties for select to authenticated
  using (deleted_at is null and public.has_property_access(id));
create policy properties_insert on public.properties for insert to authenticated with check (public.is_owner());
create policy properties_update on public.properties for update to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy properties_delete on public.properties for delete to authenticated using (public.is_owner());

-- property_members
create policy members_select on public.property_members for select to authenticated
  using (user_id = auth.uid() or public.is_owner());
create policy members_insert on public.property_members for insert to authenticated with check (public.is_owner());
create policy members_update on public.property_members for update to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy members_delete on public.property_members for delete to authenticated using (public.is_owner());

-- tasks: υπάλληλοι δημιουργούν/ενημερώνουν στα ακίνητά τους (οι περιορισμοί στο trigger), διαγραφή μόνο Owner
create policy tasks_select on public.tasks for select to authenticated using (public.has_property_access(property_id));
create policy tasks_insert on public.tasks for insert to authenticated
  with check (public.has_property_access(property_id) and created_by = auth.uid());
create policy tasks_update on public.tasks for update to authenticated
  using (public.has_property_access(property_id)) with check (public.has_property_access(property_id));
create policy tasks_delete on public.tasks for delete to authenticated using (public.is_owner());

-- financial_entries: αποκλειστικά Owner
create policy finance_owner on public.financial_entries for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- audit_log: μόνο ανάγνωση από Owner, κανείς δεν τροποποιεί
create policy audit_select on public.audit_log for select to authenticated using (public.is_owner());
revoke insert, update, delete on public.audit_log from authenticated, anon;
revoke all on all tables in schema public from anon;

-- ---------- Storage: ιδιωτικός χώρος αρχείων ----------
-- Διαδρομή αρχείων:  {property_id}/{κατηγορία}/{όνομα αρχείου}
insert into storage.buckets (id, name, public) values ('property-files', 'property-files', false)
on conflict (id) do nothing;

create or replace function public.storage_property_id(object_name text) returns uuid
language plpgsql immutable as $$
begin
  return (string_to_array(object_name, '/'))[1]::uuid;
exception when others then
  return null;
end $$;

create policy files_select on storage.objects for select to authenticated
  using (bucket_id = 'property-files' and public.has_property_access(public.storage_property_id(name)));
create policy files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'property-files' and public.has_property_access(public.storage_property_id(name)));
create policy files_update on storage.objects for update to authenticated
  using (bucket_id = 'property-files' and public.is_owner());
create policy files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'property-files' and public.is_owner());
