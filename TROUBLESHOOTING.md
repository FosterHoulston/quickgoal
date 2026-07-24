# Troubleshooting Log

A running record of problems we've hit on Quickgoal, what caused them, and how
we resolved them. It exists so that recurring issues are recognized quickly,
past decisions are traceable, and the reasoning behind a fix outlives the commit
that made it.

## How to use this file

- **Add an entry when** you diagnose a real problem (a bug, a broken build, a
  security hole, a data issue, a confusing regression) — not for routine feature
  work. If it needed investigation, it belongs here.
- **Newest entries go at the top** of the log. IDs (`TS-NNN`) are assigned in
  chronological order and never reused, so the numbers count up as you read down.
- **Update an entry's `Status`** as it moves through `Open → In progress →
  Resolved` (or `Won't fix` / `Superseded`). Keep the original problem text;
  append to the resolution rather than rewriting history.
- **Reference the evidence:** commit hashes, PR numbers, issue numbers, file
  paths. A future reader should be able to jump straight to the change.

### Entry template

```markdown
### TS-NNN — <short title>
- **Date:** YYYY-MM-DD
- **Status:** Open | In progress | Resolved | Won't fix | Superseded
- **Area:** <e.g. database / auth / dashboard / build / security / docs>
- **Symptom:** What was observed — the visible failure or smell.
- **Root cause:** Why it happened.
- **Resolution:** What we changed to fix it.
- **Refs:** <commit> / PR #N / Issue #N
- **Verification:** How we confirmed it was fixed (tests, build, manual check).
```

Dates before 2026-07-22 are reconstructed from git history and commit messages,
so their symptom/root-cause detail is best-effort. Everything from 2026-07-22
onward was logged from direct work.

---

## Open / carried-forward

These are known, unresolved items. Most live in [`TODO.md`](./TODO.md); listed
here so the log is a complete picture of outstanding problems.

- **Heatmap shading precision.** Shading levels should map to specific pass/fail
  counts per square, and should only reflect actual Pass/Fail clicks (unclicking
  should remove shading). *(TODO.md)*
- **Light/dark pill color inconsistencies** in the goal-creation form
  (tag + pass/fail buttons), dark mode especially. *(TODO.md)*
- **`categories` → `tags` rename.** The database columns are still named
  `categories` while the product language is "tags"; naming drift to reconcile.
  *(TODO.md)*
- **SQL/perf pass** based on Supabase advisor suggestions. *(TODO.md)*
- **Filterable goals table** with incomplete goals floated to the top by default.
  *(TODO.md — feature, tracked here for completeness)*

---

## Resolved log

### TS-013 — 1828-line dashboard monolith
- **Date:** 2026-07-23
- **Status:** Resolved (merged to `main`, PR #12)
- **Area:** dashboard / architecture
- **Symptom:** `app/page.tsx` had grown to 1,828 lines — one `Home` component
  holding ~30 hooks, all data access, both goal dialogs, the sign-in screen, the
  table, and the heatmap. Hard to navigate, test, or change safely. Several
  pieces were duplicated across `app/page.tsx` and `app/tags/page.tsx`.
- **Root cause:** Incremental feature growth with no extraction; shared logic
  copy-pasted rather than factored out.
- **Resolution:** Five-step refactor on `refactor/extract-pure-helpers`, each
  step independently green:
  1. Pure helpers → `lib/date.ts`, `lib/heatmap.ts`, `lib/tags.ts` (collapsed two
     divergent default-tag lists into one source). — `a1e39f1`
  2. Duplicated toast system → `components/ToastProvider.tsx`. — `ca0297b`
  3. Data access → `lib/goals.ts`, `lib/tags.ts` (also unified the new-user tag
     seed routine, previously written three times). — `f1f312e`
  4. `GoalTable` + `GoalHeatmap` components. — `8946de6`
  5. `SignInScreen`, `NewGoalDialog`, `EditGoalDialog`, `hooks/useGoalForm.ts`. — `b0fdf70`
  Result: `page.tsx` 1828 → 461 lines (−75%); tests 8 → 44.
- **Refs:** PR #12, merge `12c0b0c` (`a1e39f1`…`b0fdf70`)
- **Verification:** `tsc`, ESLint, `next build`, and 44 Vitest tests all pass;
  manual smoke test passed. Merged to `main` 2026-07-23.

### TS-012 — Tag-link partial-write drift
- **Date:** 2026-07-23
- **Status:** Resolved
- **Area:** database / dashboard
- **Symptom:** After creating or editing a goal, the UI could show tags that the
  database did not actually have. On edit, the old tags kept showing even after
  the delete had removed them; a reload silently dropped them.
- **Root cause:** A goal and its `goal_categories` links are two separate writes
  with no surrounding transaction. If the link write failed after the goal write
  committed, local state still optimistically showed the tags.
- **Resolution:** `createGoal`/`updateGoal` in `lib/goals.ts` now return
  `categoriesLinked`; the UI renders tags only when the links actually landed and
  shows a toast that the goal saved but its tags did not. No goal is discarded to
  achieve this. A true fix (both writes in one Postgres transaction) is noted as
  future work.
- **Refs:** `f1f312e`
- **Verification:** 9 data-layer tests cover the join mapping and both
  partial-write paths.

### TS-011 — Cross-user data leak via `categories_read_all` RLS policy
- **Date:** 2026-07-22
- **Status:** Resolved
- **Area:** security / database
- **Symptom:** During a pre-launch security review, production `public.categories`
  had a stray `SELECT` policy (`categories_read_all`) with `USING (true)`.
- **Root cause:** Multiple PERMISSIVE `SELECT` policies combine with `OR`, so the
  overly-broad policy made every category row (including other users' custom tag
  names/descriptions) readable by any signed-in or anonymous visitor. RLS is the
  only isolation mechanism because the anon key ships in the browser.
- **Resolution:** Added `drop policy if exists categories_read_all` to
  `supabase/policies.sql`, leaving only the correct
  `categories_read_own_or_default` rule. User ran the drop against production and
  confirmed the table dropped from 5 policies to 4.
- **Refs:** `7b394e2` / PR #9
- **Verification:** Re-ran the policy count query in Supabase (4 policies); RLS
  confirmed enabled on all four tables; no `service_role` key in source.

### TS-010 — AGENTS.md drift from project reality
- **Date:** 2026-07-22
- **Status:** Resolved
- **Area:** docs
- **Symptom:** `AGENTS.md` described components, lint, and tests as future/optional
  when all three already existed and were wired up.
- **Root cause:** Docs not updated as the project matured.
- **Resolution:** Synced the four stale lines (components dir, lint/test commands,
  test framework) to current state.
- **Refs:** `729407c` / PR #8
- **Verification:** Manual review against `package.json` scripts and repo layout.

### TS-009 — Fresh-database setup broken by obsolete `goal_term` column
- **Date:** 2026-07-22
- **Status:** Resolved
- **Area:** database
- **Symptom:** A brand-new database created from `supabase/schema.sql` could never
  save a goal — every insert failed.
- **Root cause:** `schema.sql` still declared `term goal_term not null` (plus the
  `goal_term` enum), a column the app had stopped inserting. The migration that
  removed it (`20260122_remove_goal_term.sql`) existed but was undocumented and
  not reflected in the snapshot schema.
- **Resolution:** Removed the enum and column from `schema.sql`; split
  `supabase/README.md` into "Fresh setup" vs "Upgrading an existing DB" and listed
  the missing migration.
- **Refs:** `278d10b` / PR #7
- **Verification:** Confirmed the app's insert path (`handleSave`) never referenced
  `term`; schema now matches the app.

### TS-008 — Lint + build errors
- **Date:** 2026-02-07
- **Status:** Resolved
- **Area:** build
- **Symptom:** ESLint and the production build failed.
- **Root cause:** Accumulated issues in `app/page.tsx` and a `components/ui/dialog.tsx`
  gap (reconstructed from commit).
- **Resolution:** Cleaned up the offending code so lint and `next build` passed.
- **Refs:** `129d342`
- **Verification:** Lint + build green (part of the hotfix/5 branch, PR #6).

### TS-007 — Tab navigation broken in goal-creation form
- **Date:** 2026-02-07
- **Status:** Resolved
- **Area:** dashboard / accessibility
- **Symptom:** Tab key did not move focus sensibly through the goal form — from
  the goal text field, through the date/time menu, to the tags, and finally to the
  submit button.
- **Root cause:** Missing/incorrect focus management and tab order across the form
  sections.
- **Resolution:** A series of fixes wiring tab flow field-to-field, adding a
  tab-to-submit jump, and fixing tab-out of the date/time selector.
- **Refs:** `7edf91e`, `2a95b91`, `9886a0d`, `d50949d`
- **Verification:** Manual keyboard testing (pre-chat).

### TS-006 — No arrow-key navigation between tags
- **Date:** 2026-02-07
- **Status:** Resolved
- **Area:** dashboard / accessibility
- **Symptom:** The tag list couldn't be navigated with arrow keys.
- **Root cause:** No spatial keyboard handler for the tag button grid.
- **Resolution:** Added arrow-key spatial navigation (row/column aware) with a
  roving tabindex. (Later relocated into `NewGoalDialog` during TS-013.)
- **Refs:** `711bb47`
- **Verification:** Manual keyboard testing (pre-chat).

### TS-005 — Calendar popup: not cursor-selectable, no default time
- **Date:** 2026-02-05 → 2026-02-07
- **Status:** Resolved
- **Area:** dashboard
- **Symptom:** The end date/time popup wasn't selectable with the cursor and had
  no sensible default when enabled.
- **Root cause:** Popup behavior and default-value logic incomplete.
- **Resolution:** Made the popup cursor-selectable and auto-select "now + 1 hour"
  when "End date/time" is toggled ON.
- **Refs:** `2f6e2f6`, `d50949d` (Issue #5)
- **Verification:** Manual testing (pre-chat).

### TS-004 — Delayed Pass/Fail visual feedback
- **Date:** 2026-01-30
- **Status:** Resolved
- **Area:** dashboard
- **Symptom:** The green check / red x lagged after pressing Pass/Fail.
- **Root cause:** Feedback timing coupled to the toast timing.
- **Resolution:** Show the check/x immediately on click while keeping the toast
  timing unchanged.
- **Refs:** `3ea3212`
- **Verification:** Manual testing (pre-chat).

### TS-003 — CI/CD pipeline churn
- **Date:** 2026-01-29 → 2026-01-31
- **Status:** Resolved
- **Area:** ci
- **Symptom:** A GitHub Actions CI/CD pipeline was added, then needed to be
  removed from the remote.
- **Root cause:** Pipeline not wanted/needed in its initial form.
- **Resolution:** Added (`8dc18ac`), then removed from remote (`fcb863e`).
- **Refs:** `8dc18ac`, `fcb863e`
- **Verification:** N/A (config change).

### TS-002 — Tag popup not closing
- **Date:** 2026-01-31
- **Status:** Resolved
- **Area:** tags page
- **Symptom:** The Create-Tag dialog did not close after being opened (notably via
  the `T` key), and did not close immediately when Delete was pressed.
- **Root cause:** Dialog open-state not reset on the relevant actions in
  `app/tags/page.tsx`.
- **Resolution:** Fixed the close behavior for the tag popup.
- **Refs:** `8f02507` / PR #2, #3 (Issue #1, #4)
- **Verification:** Recorded in CHANGELOG under v1.0.0 fixes.

### TS-001 — Project scaffold baseline
- **Date:** 2026-01-20
- **Status:** Resolved
- **Area:** setup
- **Symptom:** N/A — baseline entry marking the Next.js + Tailwind + Supabase
  scaffold, schema, and seed going in.
- **Root cause:** N/A.
- **Resolution:** Initial scaffold and Supabase schema/seed committed.
- **Refs:** `e5cf453`, `6124612`
- **Verification:** App builds and runs locally.
