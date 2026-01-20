# Repository Guidelines

## Project Structure & Module Organization
- `README.md` provides the product overview and stack plan.
- `docs/PLAN.md` captures the implementation plan and data model.
- `MILESTONES.md` is the step-by-step checklist.
- Source code lives in `app/` with shared UI to be added in `components/`.
- Static assets live in `public/`.
- Tests should live alongside features or in `__tests__/`.

## Build, Test, and Development Commands
- `npm run dev`: run the local development server.
- `npm run build`: create a production build.
- `npm run start`: run the production server locally.
- `npm run lint`: run lint checks (if configured).
- `npm test`: run tests (if configured).

## Coding Style & Naming Conventions
- Indentation: 2 spaces for JSON/YAML; default formatter for TS/TSX.
- File naming: `kebab-case` for route segments and folders; `PascalCase.tsx` for components.
- UI components should be self-contained and placed in `components/`.
- Prefer `const` and functional components; keep props typed in TypeScript.
- Keep scope minimal: only add what the feature truly needs. Favor clarity over cleverness, avoid clutter, and keep the codebase easy to navigate.

## Testing Guidelines
- Planned framework: Vitest or Jest with React Testing Library.
- Test filenames: `*.test.ts` or `*.test.tsx`.
- Add tests for goal creation logic and toggle-driven UI visibility.

## Commit & Pull Request Guidelines
- Keep commits small and descriptive (e.g., `Add milestones checklist`).
- PRs should include a short summary and screenshots for UI changes.
- Link any relevant issues or milestone items.

## Configuration & Secrets
- Keep Supabase URL and anon key in `.env.local` (do not commit).
- Document required env vars in the README when added.
