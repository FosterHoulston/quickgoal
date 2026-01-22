alter table public.goals enable row level security;
alter table public.goal_categories enable row level security;
drop policy if exists goals_select_own on public.goals;
drop policy if exists goals_insert_own on public.goals;
drop policy if exists goals_update_own on public.goals;
drop policy if exists goals_delete_own on public.goals;

drop policy if exists goal_categories_select_own on public.goal_categories;
drop policy if exists goal_categories_insert_own on public.goal_categories;
drop policy if exists goal_categories_delete_own on public.goal_categories;

create policy "goals_select_own"
on public.goals
for select
using (auth.uid() = user_id);

create policy "goals_insert_own"
on public.goals
for insert
with check (auth.uid() = user_id);

create policy "goals_update_own"
on public.goals
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "goals_delete_own"
on public.goals
for delete
using (auth.uid() = user_id);

create policy "goal_categories_select_own"
on public.goal_categories
for select
using (
  exists (
    select 1
    from public.goals
    where goals.id = goal_categories.goal_id
      and goals.user_id = auth.uid()
  )
);

create policy "goal_categories_insert_own"
on public.goal_categories
for insert
with check (
  exists (
    select 1
    from public.goals
    where goals.id = goal_categories.goal_id
      and goals.user_id = auth.uid()
  )
);

create policy "goal_categories_delete_own"
on public.goal_categories
for delete
using (
  exists (
    select 1
    from public.goals
    where goals.id = goal_categories.goal_id
      and goals.user_id = auth.uid()
  )
);

alter table public.categories enable row level security;
drop policy if exists categories_read_own_or_default on public.categories;
drop policy if exists categories_insert_own on public.categories;
drop policy if exists categories_update_own on public.categories;
drop policy if exists categories_delete_own on public.categories;

create policy "categories_read_own_or_default"
on public.categories
for select
using (user_id is null or auth.uid() = user_id);

create policy "categories_insert_own"
on public.categories
for insert
with check (auth.uid() = user_id);

create policy "categories_update_own"
on public.categories
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "categories_delete_own"
on public.categories
for delete
using (auth.uid() = user_id);
