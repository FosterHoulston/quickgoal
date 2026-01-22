alter table public.categories
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists description text;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'categories_user_name_unique'
  ) then
    create unique index categories_user_name_unique
      on public.categories (user_id, name);
  end if;
end $$;
