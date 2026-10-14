# Repository Guidelines

## Project Structure & Module Organization

This strict TypeScript Next.js 15 application uses the App Router. Route files live in `app/`; `globals.css` owns global styles and tokens. `components/Wanderer.tsx` contains the React UI and controls. `lib/WandererEngine.ts` coordinates lifecycle and shared state. Keep specialized behavior in `lib/wanderer/`: `simulation.ts` updates movement and vehicles, `world.ts` generates terrain, `audio.ts` owns Web Audio, `ui.ts` builds the view model, `sceneData.ts` stores copy, `types.ts` defines shared contracts, and the `render*.ts` modules draw the canvas. The `@/` alias resolves from the repository root.

There is no test or public-assets directory. Put static files in `public/` and colocate future tests or place them consistently under `tests/`.

## Build, Test, and Development Commands

- `npm install` installs the locked project dependencies (commit `package-lock.json` when generated).
- `npm run dev` starts the local development server at `http://localhost:3000` with hot reload.
- `npm run typecheck` runs the strict TypeScript compiler without emitting files.
- `npm run build` creates a production build and catches Next.js compilation errors.
- `npm start` serves the production build; run `npm run build` first.

No lint or automated test script is configured. Before submitting changes, at minimum run `npm run build` and manually exercise the scene in a browser.

## Coding Style & Naming Conventions

Follow the existing TypeScript and TSX style: two-space indentation, single quotes, semicolons, and ES modules. Keep strict types; avoid `any`, type shared engine data in `lib/wanderer/types.ts`, and annotate browser APIs explicitly. Use PascalCase for components, classes, and types; use camelCase for functions and variables. Keep route files named according to Next.js conventions (`page.tsx`, `layout.tsx`).

Preserve the boundary between declarative UI in `components/` and canvas/state behavior in `lib/`. Add behavior to the narrowest relevant `lib/wanderer/` module instead of expanding the coordinator. Reuse tokens from `app/globals.css` rather than introducing isolated color, spacing, or typography values.

## Testing Guidelines

Run `npm run typecheck` and `npm run build`. Manual checks should cover movement, Shift-to-run, Space interactions, pointer controls, loading, sound, languages, and viewport resizing. If adding tests, include an `npm test` script and use names such as `Wanderer.test.tsx` or `WandererEngine.test.ts`.

## Commit & Pull Request Guidelines

Recent history uses short subjects such as `Add Wanderer application`. Continue with concise, imperative commit messages (for example, `Fix card positioning near river`) and keep each commit focused. Pull requests should explain the user-visible change, list validation performed, link relevant issues, and include screenshots or a short recording for visual or animation changes.
