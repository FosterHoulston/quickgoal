do $$
begin
  if not exists (select 1 from pg_type where typname = 'goal_outcome') then
    create type goal_outcome as enum ('passed', 'failed');
  end if;
end $$;

alter table public.goals
  add column if not exists outcome goal_outcome;
