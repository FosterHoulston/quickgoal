insert into public.categories (name) values
  ('Health'),
  ('Career'),
  ('Learning'),
  ('Finance'),
  ('Relationships'),
  ('Mindset'),
  ('Creative')
on conflict (name) do nothing;
