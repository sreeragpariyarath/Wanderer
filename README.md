# Wanderer

An interactive, side-scrolling Canvas 2D experience built with Next.js 15, React 19, and strict TypeScript. Walk or drive through a procedurally illustrated city, forest, river, village, and floating island, with English story cards.

## Development

```sh
npm install
npm run dev
```

Open http://localhost:3000. Production: `npm run build`, then `npm start`.

## Controls and saved journeys

- A / Left Arrow and D / Right Arrow move; Shift runs or accelerates. In the river, W / Up Arrow and S / Down Arrow control swimming depth.
- Swim through the open river to discover a wrecked wooden boat and its story card, then continue to the shallow shore and the village beyond.
- Space enters/exits a nearby car or opens a story card. Hold movement controls to drive. Exiting is disabled above the safe speed.
- On-screen A, D, W, S, and Shift controls support simultaneous touch input when their actions are available. The contextual button provides car and card actions without a keyboard.
- Story cards have their own Read and Close buttons. The header control toggles sound.
- The introduction plays on a first visit and can be skipped immediately. Returning visits resume directly. Reduced-motion preference also skips it and freezes decorative animation.
- Nothing is stored in the browser: every visit starts at the beginning (the introduction can be skipped). A checkpoint bar along the bottom (City, Forest, Bridge, River, Shore, Village, Island) highlights the current section and jumps straight to any other, leaving the car if driving. Sound starts off and waits for a user gesture.
- The old `wanderer-x2` position is migrated only after the new save is written successfully. Invalid/unavailable storage falls back to a fresh journey.

## Architecture

`components/Wanderer.tsx` mounts the browser engine and subscribes with `useSyncExternalStore`. Components under `components/wanderer/` own settings, loading, story content, and controls. Static styles and tokens live in `app/globals.css`.

`lib/WandererEngine.ts` owns browser lifecycle and routes actions/events. Feature modules under `lib/wanderer/` receive explicit state and dependencies; none imports the engine class.

| Modules                                                                 | Responsibility                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `character`, `physics`, `vehicle`                                       | Movement, collisions, automatic jumps, car transitions               |
| `clock`, `camera`, `input`, `browserInput`                              | Fixed-step timing, camera smoothing, independent input sources       |
| `loading`, `loadingRender`                                              | Intro state machine and drawing                                      |
| `trees`, `buildings`, `clouds`, `bridge`, `water`, `village`, `terrain` | Individual world features                                            |
| `weather`, `weatherRender`, `particles`                                 | Weather transitions, bounded effects, injected randomness            |
| `characterRender`, `vehicleRender`, `renderEnvironment`, `renderer`     | Read-only drawing and browser canvas resources                       |
| `viewModel`, `overlays`                                                 | Stable UI snapshots and the sole animated DOM-style adapter          |
| `checkpoints`, `audio`                                                  | Named section checkpoints and gesture-unlocked sound                 |
| `config`, `state`, `types`, `sceneData`, `initialize`                   | Tuning constants, state contracts, story copy, deterministic scenery |

The engine runs 60 simulation steps per second and interpolates character, vehicle, and camera positions for rendering. Catch-up is capped at five steps. Hidden tabs pause and clear inputs, with elapsed time reset on return. Renderers receive deeply readonly scene views and never update simulation data. Canvas cache resources belong to the renderer and are released on disposal.

The world uses positive-down Y coordinates. Bridge jumps and island launches are cinematic triggers. Water crossing emits a splash event without changing physics. Landing and vehicle events drive optional effects. Save data uses safe positions rather than transient flight coordinates.

The planned developer-portfolio narrative and typed content contract are documented in [`docs/portfolio-flow.md`](docs/portfolio-flow.md). Exact content locations live in `lib/portfolio/flow.ts`; no placeholder biography is embedded in production scene data.

## Verification

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run lint
npm run format:check
npm run build
```

Unit tests cover physics, input sources, timing, lifecycle, storage, and render purity. Browser tests run in desktop Chromium and a touch-enabled mobile viewport. Their server uses port 3001. Deterministic starting positions are seeded through browser storage in test code; there is no production scene-positioning endpoint or debug global.

Manual regression checks: normal/skip intro, walk/run/backtrack, bridge jump, underwater W/S swimming and both river exits, island landing, car entry/exit/arrival, pointer cancellation, multi-touch movement, hidden-tab resume, sound, checkpoint bar jumps, short-screen story scrolling, resize and orientation changes. Compare representative intro/city/forest/bridge/river/village/island screenshots when changing artwork.

Use `npm run format` to apply the repository formatter. Generated browser reports, screenshots, and local review artifacts are ignored by Git.

## CI/CD

GitHub Actions in `.github/workflows/`:

- `ci.yml` runs on pull requests: typecheck, lint, format check, unit tests, production build (static export to `out/`, with a client JS budget), and Playwright e2e for desktop and mobile against that exported build. The `CI gate` job is the one status check to require in branch protection.
- `security.yml` runs `npm audit`, CodeQL, and dependency review on pull requests, plus a weekly schedule. The audit blocks on critical only, as a temporary documented exception for a PostCSS advisory bundled in Next 15; reassess when upgrading Next.js.
- `deploy.yml` runs on `main` and manual dispatch: it re-runs CI, publishes the tested `out/` artifact to Cloudflare Pages with `wrangler pages deploy`, then smoke-tests both the deployment URL and the production URL (status, CSP, `X-Frame-Options`, immutable asset caching).

Hosting is Cloudflare Pages (free plan), project `sreerag-wanderer`, production branch `main`, serving the static export. `wrangler.jsonc` configures the Pages project and `public/_headers` supplies security and cache headers. `npm run preview` serves the export locally through the Pages runtime with those headers.

Setup:

1. Create the project once: `npx wrangler pages project create sreerag-wanderer --production-branch main`.
2. In a GitHub `production` environment add secrets `CLOUDFLARE_API_TOKEN` (account permission Cloudflare Pages: Edit only) and `CLOUDFLARE_ACCOUNT_ID`.
3. After the custom domain is live, set the repository variable `SITE_URL` (for example `https://sreerag.is-a.dev`); until then it defaults to `https://sreerag-wanderer.pages.dev`.
4. Require the `CI gate` check on `main`.
