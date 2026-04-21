-- =============================================================================
-- Dobbi – Supabase Schema
-- Upload this file in Supabase → SQL Editor → Run
-- =============================================================================

-- ── Helpers ──────────────────────────────────────────────────────────────────

-- Auto-update updated_at columns
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- =============================================================================
-- PROFILES  (extends Supabase auth.users)
-- =============================================================================

create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text not null default '',
  avatar          text not null default '🎓',
  level           integer not null default 1,
  xp              integer not null default 0,
  savings_goal    numeric(10,2) not null default 1000.00,
  saved_so_far    numeric(10,2) not null default 0.00,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function handle_updated_at();

alter table profiles enable row level security;
create policy "Users can read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    '🎓'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- =============================================================================
-- TRANSACTIONS
-- =============================================================================

create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  amount      numeric(10,2) not null,
  category    text not null default 'food',  -- food | transport | shopping | subs | education
  icon        text not null default 'circle',
  txn_date    date not null default current_date,
  txn_time    text not null default '',
  is_expense  boolean not null default true,
  scanned     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index transactions_user_id_idx on transactions(user_id);
create index transactions_txn_date_idx on transactions(txn_date desc);

alter table transactions enable row level security;
create policy "Users manage own transactions" on transactions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =============================================================================
-- BUDGET CATEGORIES  (per-user monthly limits)
-- =============================================================================

create table if not exists budget_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  category_id text not null,   -- food | transport | shopping | subs | education
  label       text not null,
  icon        text not null,
  budget      numeric(10,2) not null default 0.00,
  color       text not null default '#6355E8',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, category_id)
);

create trigger budget_categories_updated_at
  before update on budget_categories
  for each row execute function handle_updated_at();

alter table budget_categories enable row level security;
create policy "Users manage own budget categories" on budget_categories
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed default categories for every new user
create or replace function seed_default_budget_categories(p_user_id uuid)
returns void as $$
begin
  insert into budget_categories (user_id, category_id, label, icon, budget, color) values
    (p_user_id, 'food',      'Food & Drinks', 'coffee',       300.00, '#6355E8'),
    (p_user_id, 'transport', 'Transport',     'navigation',    80.00, '#00B894'),
    (p_user_id, 'shopping',  'Shopping',      'shopping-bag', 100.00, '#F59E0B'),
    (p_user_id, 'subs',      'Subscriptions', 'repeat',        40.00, '#06B6D4'),
    (p_user_id, 'education', 'Education',     'book',         100.00, '#8B5CF6')
  on conflict (user_id, category_id) do nothing;
end;
$$ language plpgsql;

create or replace function handle_new_profile_seed()
returns trigger as $$
begin
  perform seed_default_budget_categories(new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_seed
  after insert on profiles
  for each row execute function handle_new_profile_seed();


-- =============================================================================
-- GOALS
-- =============================================================================

create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text not null default '',
  xp_reward   integer not null default 0,
  emoji       text not null default '🎯',
  progress    numeric(10,2) not null default 0,
  target      numeric(10,2) not null default 100,
  unit        text not null default '$',          -- $ | days | months
  status      text not null default 'active',     -- active | completed | locked
  difficulty  text not null default 'medium',     -- easy | medium | hard
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger goals_updated_at
  before update on goals
  for each row execute function handle_updated_at();

alter table goals enable row level security;
create policy "Users manage own goals" on goals
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =============================================================================
-- DAILY CHALLENGES
-- =============================================================================

create table if not exists daily_challenges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  xp          integer not null default 0,
  icon        text not null default 'star',
  done        boolean not null default false,
  challenge_date date not null default current_date,
  created_at  timestamptz not null default now(),
  unique (user_id, challenge_date, title)
);

alter table daily_challenges enable row level security;
create policy "Users manage own challenges" on daily_challenges
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =============================================================================
-- BADGES
-- =============================================================================

create table if not exists badges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  badge_id    text not null,
  label       text not null,
  emoji       text not null,
  description text not null default '',
  unlocked    boolean not null default false,
  unlocked_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, badge_id)
);

alter table badges enable row level security;
create policy "Users manage own badges" on badges
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed default badges for every new user
create or replace function seed_default_badges(p_user_id uuid)
returns void as $$
begin
  insert into badges (user_id, badge_id, label, emoji, description, unlocked, unlocked_at) values
    (p_user_id, 'first-deal',   'First Deal',    '🎯', 'Claimed your first student deal',     true,  now()),
    (p_user_id, 'budget-pro',   'Budget Pro',    '📊', 'Categorized a full week of spending',  true,  now()),
    (p_user_id, 'saver-streak', 'Week Streak',   '🔥', 'Logged in 7 days straight',            true,  now()),
    (p_user_id, 'deal-hunter',  'Deal Hunter',   '🏆', 'Claim 10 deals to unlock',             false, null),
    (p_user_id, 'penny',        'Penny Pincher', '💰', 'Save $100 in one month',               false, null),
    (p_user_id, 'level5',       'Level 5',       '⚡', 'Reach level 5',                        false, null),
    (p_user_id, 'scanner',      'Receipt Nerd',  '📸', 'Scan 5 receipts',                      false, null),
    (p_user_id, 'goalcrush',    'Goal Crusher',  '🎉', 'Complete 3 personal goals',            false, null)
  on conflict (user_id, badge_id) do nothing;
end;
$$ language plpgsql;

create or replace function handle_new_profile_badges()
returns trigger as $$
begin
  perform seed_default_badges(new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_badges
  after insert on profiles
  for each row execute function handle_new_profile_badges();


-- =============================================================================
-- CONVERSATIONS  (Dobbi chat history)
-- =============================================================================

create table if not exists conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null default 'New Chat',
  created_at  timestamptz not null default now()
);

alter table conversations enable row level security;
create policy "Users manage own conversations" on conversations
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =============================================================================
-- MESSAGES  (Dobbi chat messages)
-- =============================================================================

create table if not exists messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references conversations(id) on delete cascade,
  role              text not null,   -- user | assistant
  content           text not null,
  created_at        timestamptz not null default now()
);

create index messages_conversation_id_idx on messages(conversation_id);

alter table messages enable row level security;
create policy "Users manage own messages" on messages
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and c.user_id = auth.uid()
    )
  );


-- =============================================================================
-- Done!
-- Every new sign-up will automatically get:
--   • A profile row
--   • 5 default budget categories
--   • 8 badges (3 unlocked, 5 locked)
-- =============================================================================
