-- ============================================================
--  Dobbi – full database setup
--  Safe to run even if tables already exist
-- ============================================================

-- 1. Profiles
create table if not exists public.profiles (
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
create table if not exists public.badges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid    not null references public.profiles on delete cascade,
  badge_id   text    not null,
  unlocked   boolean not null default false,
  created_at timestamptz      default now()
);

-- 3. Transactions
create table if not exists public.transactions (
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

-- 4. Conversations (chat history)
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles on delete cascade,
  title      text not null default 'Dobbi Chat',
  created_at timestamptz default now()
);

-- 5. Messages (per conversation)
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  role            text not null,
  content         text not null,
  created_at      timestamptz default now()
);

-- 6. Budget categories
create table if not exists public.budget_categories (
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
exception when others then
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Row-Level Security
alter table public.profiles          enable row level security;
alter table public.badges            enable row level security;
alter table public.transactions      enable row level security;
alter table public.budget_categories enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;

drop policy if exists "own profile"            on public.profiles;
drop policy if exists "own badges"             on public.badges;
drop policy if exists "own transactions"       on public.transactions;
drop policy if exists "own budget categories"  on public.budget_categories;
drop policy if exists "own conversations"      on public.conversations;
drop policy if exists "own messages"           on public.messages;

create policy "own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "own badges"
  on public.badges for all using (auth.uid() = user_id);

create policy "own transactions"
  on public.transactions for all using (auth.uid() = user_id);

create policy "own budget categories"
  on public.budget_categories for all using (auth.uid() = user_id);

create policy "own conversations"
  on public.conversations for all using (auth.uid() = user_id);

create policy "own messages"
  on public.messages for all
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  ));
