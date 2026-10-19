# Repository Guidelines

## Structure and boundaries

This strict TypeScript Next.js 15 App Router application keeps routes in `app/` and UI styles/tokens in `app/globals.css`. `components/Wanderer.tsx` mounts the scene; `components/wanderer/` owns declarative React controls, settings, loading, and story cards.

`lib/WandererEngine.ts` coordinates browser lifecycle, UI subscriptions, and event routing. Specialized modules under `lib/wanderer/` own character/vehicle movement, physics, camera, input, weather, water, loading, audio, persistence, and individual scenery renderers. See README for the module map. The `@/` alias resolves from the root.

Feature modules must not import `WandererEngine` or use `.call(this)`. Accept explicit state and narrow dependencies. Renderers receive deeply readonly state and cannot advance the simulation. Browser canvas caches belong to `SceneRenderer`; animated DOM styles belong only to `overlays.ts`. UI content/accessibility belongs to React.

## Commands and validation

- `npm install`: install dependencies; commit lockfile changes.
- `npm run dev`: development server on port 3000.
- `npm run typecheck`: strict TypeScript checking.
- `npm test`: Vitest behavioral and architecture regressions.
- `npx playwright install chromium`: install the browser used by integration tests.
- `npm run test:e2e`: desktop/mobile browser tests; test server uses port 3001.
- `npm run lint` and `npm run format:check`: code quality checks.
- `npm run format`: apply formatting.
- `npm run build` then `npm start`: production build and server.

CI runs the same checks on every pull request (the `CI gate` job must pass), and `main` deploys to Cloudflare as a static export, so keep the app free of server-only Next features. Before submitting changes, run the relevant tests, typecheck, lint, format check, and production build. Manually verify movement, run, Space/contextual actions, pointer controls, loading, sound, persistence, and viewport resizing. Capture screenshots for artwork/layout changes.

## Coding conventions

Use two-space indentation, single quotes, semicolons, and ES modules. Follow Prettier. Keep strict types; avoid `any`. Use descriptive state fields, PascalCase types/components/classes, and camelCase functions. Shared contracts live in `types.ts` or their owning feature module. Reuse CSS tokens.

Use the fixed simulation clock and time-based rates. Keep randomness injectable in effects. New state must have clear ownership and cleanup. Preserve validated versioned save compatibility; do not persist held inputs or transient velocities. Keep tests deterministic and put them under `tests/`, with browser tests in `tests/e2e/`. No production debug hooks for positioning scenes.

## Commits and pull requests

Use concise imperative commit subjects and focused changes. PRs describe the user-visible change, validation, relevant issues, and screenshots/recordings for visual or animation changes.
