# Repository Guidelines

## Project Structure & Module Organization

This Next.js 15 application uses the App Router. Route files live in `app/`; `globals.css` owns global styles and design tokens. `components/Wanderer.jsx` contains the client-facing React UI and controls. `lib/WandererEngine.js` coordinates lifecycle and shared state. Keep specialized behavior in `lib/wanderer/`: `simulation.js` updates movement and vehicles, `world.js` generates terrain, `audio.js` owns Web Audio, `ui.js` builds the view model, `sceneData.js` stores copy, and the `render*.js` modules draw the canvas. The `@/` alias resolves from the repository root.

There is currently no dedicated test or public-assets directory. Add static files under `public/` and colocate future tests with their subject or place them under `tests/`, but stay consistent once a pattern is established.

## Build, Test, and Development Commands

- `npm install` installs the locked project dependencies (commit `package-lock.json` when generated).
- `npm run dev` starts the local development server at `http://localhost:3000` with hot reload.
- `npm run build` creates a production build and catches Next.js compilation errors.
- `npm start` serves the production build; run `npm run build` first.

No lint or automated test script is configured. Before submitting changes, at minimum run `npm run build` and manually exercise the scene in a browser.

## Coding Style & Naming Conventions

Follow the existing JavaScript and JSX style: two-space indentation, single quotes, semicolons, and ES modules. Use PascalCase for React components and classes (`Wanderer`, `WandererEngine`), camelCase for functions and variables, and descriptive CSS custom properties such as `--color-accent-500`. Keep route files named according to Next.js conventions (`page.js`, `layout.js`).

Preserve the boundary between declarative UI in `components/` and canvas/state behavior in `lib/`. Add behavior to the narrowest relevant `lib/wanderer/` module instead of expanding the coordinator. Reuse tokens from `app/globals.css` rather than introducing isolated color, spacing, or typography values.

## Testing Guidelines

Manual checks should cover A/D and arrow-key movement, Shift-to-run, Space interactions, pointer controls, loading/intro behavior, sound toggling, and viewport resizing. If adding tests, include an `npm test` script and use clear names such as `Wanderer.test.jsx` or `WandererEngine.test.js`.

## Commit & Pull Request Guidelines

Recent history uses short subjects such as `Add Wanderer application`. Continue with concise, imperative commit messages (for example, `Fix card positioning near river`) and keep each commit focused. Pull requests should explain the user-visible change, list validation performed, link relevant issues, and include screenshots or a short recording for visual or animation changes.
