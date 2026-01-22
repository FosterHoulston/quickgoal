do $$
begin
  if not exists (select 1 from pg_type where typname = 'goal_term') then
    create type goal_term as enum ('short', 'long');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'goal_outcome') then
    create type goal_outcome as enum ('passed', 'failed');
  end if;
end $$;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  term goal_term not null,
  outcome goal_outcome,
  created_at timestamptz not null default now(),
  end_at timestamptz
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text
);

create unique index if not exists categories_user_name_unique
  on public.categories (user_id, name);

create table if not exists public.goal_categories (
  goal_id uuid not null references public.goals(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (goal_id, category_id)
);
