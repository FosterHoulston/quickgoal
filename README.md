# quickgoal
Minimalist goal-tracking web app for fast goal capture.

## v1.0 available now!
<https://quickgoal.vercel.app>

## Versioning
Quickgoal follows semantic versioning: `MAJOR.MINOR.PATCH`.
- Patch (`1.0.1`): hotfixes and bug fixes only.
- Minor (`1.1.0`): backwards-compatible features or UI additions.
- Major (`2.0.0`): breaking changes or major behavior shifts.

## Product summary
Quickgoal is a web app to capture goals with:
- Automatic timestamping when the user starts typing a goal.
- Optional end-datetime inputs that appear when toggled on.
- Multi-select goal categories.
- Simple, clean UI focused on fast entry and review.

## Planned stack
- App: Next.js (TypeScript) + Tailwind CSS + shadcn/ui
- Auth + DB: Supabase (Postgres + Auth + RLS)
- Hosting: Vercel (free tier) + Supabase free tier

## Auth plan
- Google sign-in (OAuth/OIDC)
- Email sign-in (magic link or email+password)

## Docs
- Implementation plan: `docs/PLAN.md`
- Milestones checklist: `MILESTONES.md`
- Changelog: `CHANGELOG.md`

## Development
- `npm install`: install dependencies
- `npm run dev`: start local dev server
- `npm run build`: build for production
- `npm run start`: run the production build locally
- `npm run lint`: run lint checks

## Supabase setup
- Run `supabase/schema.sql` to create tables.
- Run `supabase/policies.sql` to enable RLS and policies.
- Run `supabase/seed.sql` to seed categories.

## Environment variables
Create a `.env.local` in the app root with:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ADSENSE_CLIENT=your-adsense-client-id
NEXT_PUBLIC_ADSENSE_SLOT=your-adsense-slot-id
```
