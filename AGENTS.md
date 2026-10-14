# Repository Guidelines

## Project Structure & Module Organization

This is a small Next.js 15 application using the App Router. Route-level files live in `app/`: `layout.js` defines document metadata and the root shell, `page.js` renders the experience, and `globals.css` owns global styles and design tokens. `components/Wanderer.jsx` is the client-facing React UI and input layer. `lib/WandererEngine.js` coordinates the experience, while focused modules under `lib/wanderer/` contain simulation, rendering, audio, UI state, world generation, and scene data. The `@/` alias resolves from the repository root, so prefer imports such as `@/components/Wanderer`.

There is currently no dedicated test or public-assets directory. Add static files under `public/` and colocate future tests with their subject or place them under `tests/`, but stay consistent once a pattern is established.

## Build, Test, and Development Commands

- `npm install` installs the locked project dependencies (commit `package-lock.json` when generated).
- `npm run dev` starts the local development server at `http://localhost:3000` with hot reload.
- `npm run build` creates a production build and catches Next.js compilation errors.
- `npm start` serves the production build; run `npm run build` first.

No lint or automated test script is configured. Before submitting changes, at minimum run `npm run build` and manually exercise the scene in a browser.

## Coding Style & Naming Conventions

Follow the existing JavaScript and JSX style: two-space indentation, single quotes, semicolons, and ES modules. Use PascalCase for React components and classes (`Wanderer`, `WandererEngine`), camelCase for functions and variables, and descriptive CSS custom properties such as `--color-accent-500`. Keep route files named according to Next.js conventions (`page.js`, `layout.js`).

Preserve the boundary between declarative UI in `components/` and canvas/state behavior in `lib/`. Reuse the tokens in `app/globals.css` rather than introducing isolated color, spacing, or typography values.

## Testing Guidelines

Manual checks should cover A/D and arrow-key movement, Shift-to-run, Space interactions, pointer controls, loading/intro behavior, sound toggling, and viewport resizing. If adding tests, include an `npm test` script and use clear names such as `Wanderer.test.jsx` or `WandererEngine.test.js`.

## Commit & Pull Request Guidelines

Git history is not available in this checkout, so no repository-specific commit convention can be inferred. Use concise, imperative subjects (for example, `Fix card positioning near river`). Keep commits focused. Pull requests should explain the user-visible change, list validation performed, link relevant issues, and include screenshots or a short recording for visual or animation changes.
