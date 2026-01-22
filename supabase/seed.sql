insert into public.categories (name, description) values
  ('Health', null),
  ('Career', null),
  ('Learning', null),
  ('Finance', null),
  ('Relationships', null),
  ('Mindset', null),
  ('Creative', null)
on conflict do nothing;
