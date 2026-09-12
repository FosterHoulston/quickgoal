# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to
Semantic Versioning.

## v1.0.2 - 2026-09-12
### Fixes
- Goal table no longer jumps to the bottom of the list on dashboard load, or
  when a goal is added or removed. It now re-pins to the latest row only when
  the heatmap is opened, which is what the behavior was always meant to do.

## v1.0.1 - 2026-02-07
Keyboard and input handling in the goal-creation form. (#6)
### Fixes
- End date/time popup is now selectable with the cursor, and auto-selects
  "now + 1 hour" when the toggle is switched ON. (#5)
- Tab now moves focus sensibly through the goal-creation form — from the goal
  field, through the date/time menu, to the tags, and on to the submit button.
- Tags can be navigated with the arrow keys (row- and column-aware).

## v1.0.0 - 2026-01-26
- Initial public release.
### FEATURES
- Google sign-in with Supabase authentication.
- Instant goal timestamps on first keystroke.
- Optional end date toggle with datetime input.
- Tag (category) multi-select and tags management.
- Save goals to Supabase with recent-first sorting.
- Editable goals with delete support.
- Pass/fail outcomes with heatmap progress view.
- Keyboard shortcuts for creating goals and tags.

### Fixes
- Create-Tag form not closing after being opened via the T key. (#1)
