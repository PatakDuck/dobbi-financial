-- ============================================================
--  Dobbi – full database setup
--  Run this in Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. Profiles (one row per user, auto-created on signup)
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  name          text        not null default '',
  avatar        text        not null default '🎓',
  xp            integer     not null default 0,
  level         integer     not null default 1,
  savings_goal  numeric     not null default 500,
  saved_so_far  numeric     not null default 0,
  created_at    timestamptz          default now()
);

-- 2. Badges
create table public.badges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid    not null references public.profiles on delete cascade,
  badge_id   text    not null,
  unlocked   boolean not null default false,
  created_at timestamptz      default now()
);

-- 3. Transactions
create table public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid    not null references public.profiles on delete cascade,
  name       text    not null,
  amount     numeric not null,
  category   text    not null default 'food',
  icon       text    not null default 'coffee',
  txn_date   date    not null default current_date,
  txn_time   text    not null default '',
  is_expense boolean not null default true,
  scanned    boolean not null default false,
  created_at timestamptz      default now()
);

-- 4. Budget categories
create table public.budget_categories (
  category_id text    not null,
  user_id     uuid    not null references public.profiles on delete cascade,
  label       text    not null,
  icon        text    not null default 'tag',
  budget      numeric not null default 0,
  color       text    not null default '#6355E8',
  primary key (category_id, user_id)
);

-- 5. Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Student'),
    '🎓'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Row-Level Security (users can only access their own data)
alter table public.profiles          enable row level security;
alter table public.badges            enable row level security;
alter table public.transactions      enable row level security;
alter table public.budget_categories enable row level security;

create policy "own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "own badges"
  on public.badges for all using (auth.uid() = user_id);

create policy "own transactions"
  on public.transactions for all using (auth.uid() = user_id);

create policy "own budget categories"
  on public.budget_categories for all using (auth.uid() = user_id);
