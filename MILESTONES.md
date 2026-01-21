# Milestones

## 1. Project setup
- [ ] Initialize Next.js app (TypeScript).
- [ ] Add Tailwind CSS.
- [ ] Add shadcn/ui and a base theme.
- [ ] Add a simple layout shell.

## 2. Supabase setup
- [ ] Create Supabase project.
- [ ] Define tables: `goals`, `categories`, `goal_categories`.
- [ ] Add Row Level Security policies.
- [ ] Seed a small set of categories.

## 3. Auth
- [ ] Enable Google provider in Supabase.
- [ ] Enable Email provider (magic link or password).
- [ ] Add sign-in UI in the app.
- [ ] Verify sign-in and sign-out flow.

## 4. Goal creation
- [ ] Build goal input with timestamp-on-first-keystroke behavior.
- [ ] Add short/long term toggle.
- [ ] Add end-datetime toggle and input.
- [ ] Add category multi-select.
- [ ] Save goals to Supabase.

## 5. Goal list
- [ ] List saved goals by most recent.
- [ ] Show term, timestamp, end-datetime, categories.
- [ ] Add empty state for no goals.

## 6. Polish and validation
- [ ] Add client-side validation for required fields.
- [ ] Improve spacing, typography, and mobile layout.
- [ ] Add loading and error states.

## 7. Deployment
- [ ] Push to GitHub.
- [ ] Deploy on Vercel.
- [ ] Configure production env vars.
- [ ] Smoke test on the public URL.
