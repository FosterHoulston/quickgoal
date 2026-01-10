# quickgoal
Minimalist goal-tracking web app for short-term and long-term goals.

## Product summary
Quickgoal is a web app to capture short-term and long-term goals with:
- Automatic timestamping when the user starts typing a goal.
- Optional duration and end-datetime inputs that appear when toggled on.
- Multi-select goal categories.
- Simple, clean UI focused on fast entry and review.

## Planned stack
- App: Next.js (TypeScript) + Tailwind CSS + shadcn/ui
- Auth + DB: Supabase (Postgres + Auth + RLS)
- Hosting: Vercel (free tier) + Supabase free tier

## Auth plan
- Google sign-in (OAuth/OIDC)
- Email sign-in (magic link or email+password)
- Apple sign-in is optional and requires a paid Apple developer account

## Docs
- Implementation plan: `docs/PLAN.md`
- Milestones checklist: `MILESTONES.md`
- features:
