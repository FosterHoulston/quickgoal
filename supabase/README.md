# Supabase setup

## 1. Create a project
- Go to Supabase and create a new project.
- Save the project URL and anon key for later.

## 2. Run the SQL files

### Fresh setup
`supabase/schema.sql` already reflects the current data model, so a new project only needs these three, in order:
1. `supabase/schema.sql`
2. `supabase/policies.sql`
3. `supabase/seed.sql`

### Upgrading an existing DB
If you set up the database before these changes landed, run the migrations that apply to you, in order:
1. `supabase/migrations/20250120_add_goal_outcome.sql`
2. `supabase/migrations/20250120_remove_duration.sql`
3. `supabase/migrations/20250120_add_tags_fields.sql`
4. `supabase/migrations/20250120_fix_categories_unique.sql`
5. `supabase/migrations/20260122_remove_goal_term.sql`
6. `supabase/migrations/20260124_add_user_settings.sql`

## 3. Configure Auth providers
- Enable Google provider.
- Enable Email provider (magic link or password).
- Add redirect URLs:
  - Local: `http://localhost:3000`
  - Production: your Vercel URL (for example `https://quickgoal.vercel.app`)

## 4. Add environment variables
Create a `.env.local` in the app root with:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Verify
- Start the app: `npm run dev`
- Sign in with Google or email.
- Confirm you can read categories and create goals.
