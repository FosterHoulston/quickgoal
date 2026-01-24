# Milestones

## 1. Project setup
- [x] Initialize Next.js app (TypeScript).
- [x] Add Tailwind CSS.
- [x] Add shadcn/ui and a base theme.
- [x] Add a simple layout shell.

## 2. Supabase setup
- [ ] Create Supabase project.
- [x] Define tables: `goals`, `categories`, `goal_categories`.
- [x] Add Row Level Security policies.
- [x] Seed a small set of categories.

## 3. Auth
- [ ] Enable Google provider in Supabase.
- [ ] Enable Email provider (magic link or password).
- [x] Add sign-in UI in the app.
- [x] Verify sign-in and sign-out flow.

## 4. Goal creation
- [x] Build goal input with timestamp-on-first-keystroke behavior.
- [x] Add short/long term toggle.
- [x] Add end-datetime toggle and input.
- [x] Add category multi-select.
- [x] Save goals to Supabase.

## 5. Goal list
- [x] List saved goals by most recent.
- [ ] Show term, timestamp, end-datetime, categories.
- [x] Add empty state for no goals.

## 6. Polish and validation
- [x] Add client-side validation for required fields.
- [x] Improve spacing, typography, and mobile layout.
- [x] Add loading and error states.

## 7. Deployment
- [ ] Push to GitHub.
- [ ] Deploy on Vercel.
- [ ] Configure production env vars.
- [ ] Smoke test on the public URL.
