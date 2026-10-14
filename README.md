# Wanderer

Wanderer is an interactive, side-scrolling canvas experience built with Next.js and React. Walk through a procedurally illustrated world containing a city, forest, river, changing weather, village, story cards, and a driveable car.

## Features

- Responsive Canvas 2D scene with procedural terrain and scenery
- Keyboard and pointer controls for walking, running, and driving
- Animated loading sequence and environmental transitions
- Expandable story cards positioned throughout the world
- Optional generated sound effects using the Web Audio API
- English and Japanese interface content
- Automatic position persistence through browser local storage

## Getting Started

Install the dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

For a production build:

```bash
npm run build
npm start
```

## Controls

| Input | Action |
| --- | --- |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `Shift` | Run or accelerate |
| `Space` | Enter/exit the car or expand a nearby card |
| On-screen buttons | Pointer and touch movement |

Use the header controls to switch between English and Japanese or enable sound. The last world position is restored after the introduction on a later visit.

## Project Structure

```text
app/                         Next.js App Router entry points and global CSS
components/Wanderer.jsx      Client-side markup and controls
lib/WandererEngine.js        Engine coordinator and lifecycle
lib/wanderer/audio.js        Web Audio behavior
lib/wanderer/simulation.js   Movement, vehicle, and intro state updates
lib/wanderer/world.js        Terrain math and procedural point generation
lib/wanderer/renderIntro.js  Introduction rendering
lib/wanderer/renderActors.js Character and vehicle rendering
lib/wanderer/renderEnvironment.js
                             Environment and main scene rendering
lib/wanderer/sceneData.js    Captions and story-card content
lib/wanderer/ui.js           Language and UI view-model logic
```

`WandererEngine` remains the public coordinator. Its methods delegate to the focused modules under `lib/wanderer/`, allowing the simulation and render systems to evolve independently while sharing engine state.

## Development Notes

The project uses JavaScript, React 19, and Next.js 15. Global design tokens, typography, and reusable component styles live in `app/globals.css`. Prefer those CSS variables when adjusting the visual system.

No automated test or lint script is currently configured. Before submitting a change, run `npm run build` and manually verify movement, cards, the car, sound, language switching, loading behavior, and responsive canvas resizing.
