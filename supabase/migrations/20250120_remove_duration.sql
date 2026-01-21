do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'goals'
      and column_name = 'duration_minutes'
  ) then
    update public.goals
    set duration_minutes = null
    where duration_minutes is not null;

    alter table public.goals
      drop column duration_minutes;
  end if;
end $$;
