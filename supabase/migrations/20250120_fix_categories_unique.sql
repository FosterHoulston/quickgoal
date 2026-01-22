do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'categories_name_key'
      and conrelid = 'public.categories'::regclass
  ) then
    alter table public.categories
      drop constraint categories_name_key;
  end if;
end $$;

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
