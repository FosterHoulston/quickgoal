# Supabase setup

## 1. Create a project
- Go to Supabase and create a new project.
- Save the project URL and anon key for later.

## 2. Run the SQL files
Run these in the Supabase SQL editor in order:
1. `supabase/schema.sql`
2. `supabase/policies.sql`
3. `supabase/seed.sql`
4. `supabase/migrations/20250120_add_goal_outcome.sql` (if upgrading an existing DB)
5. `supabase/migrations/20250120_remove_duration.sql` (if upgrading an existing DB)

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
