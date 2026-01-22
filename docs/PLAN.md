# Quickgoal plan

## Goals
- Capture goals with minimal friction.
- Timestamp the goal when the user starts typing.
- Reveal end-datetime only when toggled on.
- Support multi-select goal categories.
- Keep the UI minimal, clean, and fast.

## User flow
1. User signs in with Google or email.
2. User starts typing a goal, which sets the timestamp.
3. User optionally toggles end-datetime and fills the field.
4. User selects one or more categories.
5. User saves the goal and sees it in the list.

## Tech stack
- Next.js (TypeScript) for the web app.
- Tailwind CSS and shadcn/ui for UI.
- Supabase for Auth and Postgres storage with Row Level Security.
- Vercel for free hosting with a public URL.

## Data model
### goals
- id (uuid, pk)
- user_id (uuid, fk -> auth.users)
- title (text)
- created_at (timestamp)
- end_at (timestamp, nullable)

### categories
- id (uuid, pk)
- name (text)

### goal_categories (join table, recommended)
- goal_id (uuid, fk -> goals)
- category_id (uuid, fk -> categories)

## Timestamp behavior
- On the first keystroke in the goal input, set `draftStartedAt = now()`.
- Use `draftStartedAt` as `created_at` when the user saves.
- Optional upgrade later: create a draft row on first keystroke and update it live.

## UI behavior
- End-datetime toggle shows a datetime picker when enabled.
- Category multi-select shows tags/chips for selected categories.

## Hosting and deployment
- Push repo to GitHub.
- Deploy on Vercel (free tier).
- Configure Supabase URL and anon key in Vercel env vars.

## Auth
- Enable Google and Email providers in Supabase.
- Configure redirect URLs for local dev and production.
- Apple sign-in optional; requires Apple developer membership.
