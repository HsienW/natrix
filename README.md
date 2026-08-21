# Vanilla JS Snake Game

- Vanilla JS practise
- Design Pattern practise


## Demo link
- [Go try the game](https://competent-khorana-6f72c1.netlify.app)

## Getting start
```
cd vanilla-js-snake-game
npm ci
npm start 
click start button
```

## Development
- Run `npm start` for a dev server. Navigate to `http://localhost:8080`
- Run `npm run build` for a production build in `dist/`.
- Run `npm run preview` to serve the production build at `http://127.0.0.1:4173`.
- Run `npm test` for the baseline test suite.
- Run `npm run test-coverage` for a coverage report.
- Run `npm run verify:dev-server` for the development server smoke check.
- Run `npm run build` before `npm run verify:preview` for the production preview smoke check.

## Modernization baseline

- The pre-modernization source is preserved by the `legacy-v1.0.0` tag.
- [Legacy gameplay baseline](docs/baseline/gameplay-baseline.md)
- [Performance baseline template](docs/baseline/performance-baseline.md)

## Runtime modernization status

Phase 0 is complete. Phase 1 (M1) is complete through PR-06.

### Input boundary (PR-03)

```text
KeyboardEvent
    -> KeyboardInput
    -> bounded InputBuffer
    -> simulation step drains commands
    -> applyCommands changes snake direction
```

- Browser keyboard codes are translated into logical `CHANGE_DIRECTION` commands.
- `KeyboardInput` is the sole production owner of the `keydown` listener.
- Commands remain buffered while paused and are applied by the next simulation step.
- Restarting a match does not register duplicate keyboard listeners.

### Simulation boundary (PR-04)

```text
Browser input / controls
    -> commands
Runtime / clock
    -> simulation step
Simulation
    -> GameState + events
Snapshot projection
    -> Renderer
Renderer / HUD
    -> DOM or Canvas
```

- `stepGame(state, commands, environment)` is a pure function with no DOM, rAF, or timer dependency.
- GameState is serializable plain data with `{x, y}` integer grid positions.
- `simulation/` and `state/` contain no browser globals or DOM imports.
- Rendering can be omitted entirely while movement, food, score, death, and finish still work.

### Fixed-timestep loop (PR-05)

- One accumulator-based `FixedTimestepLoop` drives the simulation at 10 Hz.
- Display refresh rate (60/120/144 Hz) does not change authoritative simulation speed.
- Input commands are drained once per logical simulation step, not per render frame.
- The legacy dual-rAF animation and countdown loops have been removed.

### Explicit lifecycle (PR-06)

```text
IDLE --START--> RUNNING --PAUSE--> PAUSED --RESUME--> RUNNING
                  |                    |
                  FINISH               FINISH
                  v                    v
               FINISHED --RESET--> IDLE
```

- A `RuntimeStateMachine` enforces valid transitions with structured results.
- Invalid transitions return `INVALID_RUNTIME_TRANSITION` with no side effect.
- Duplicate START while running schedules no second rAF.
- Paused elapsed wall time is not added on resume.
- Lifecycle listeners are notified on each successful transition.

### Deterministic simulation and replay

- Seeded RNG makes initial placement and food relocation reproducible.
- Player commands are recorded against logical simulation ticks.
- Versioned replay payloads run synchronously without browser or renderer APIs.
- Canonical state fingerprints verify live runtime and replay parity.

### Renderer boundary

- `GameRuntime` renders snapshots through the `init / render / resize / destroy` contract.
- `RendererHost` owns renderer initialization, replacement, resize, and cleanup order.
- `NullRenderer` keeps headless simulation and replay independent from browser rendering.
- `DOMRenderer` remains the default reference renderer.
- `CanvasRenderer` draws the same world snapshot with DPR-aware backing-store dimensions.
- Add `?renderer=canvas` to the URL to use Canvas. Missing or invalid values fall back to DOM.

## Game rule
![image](https://user-images.githubusercontent.com/20525933/132933824-1c4b95b5-2d8f-46ab-9996-38121f5935c2.png)

- The team is divided into red and blue
- The snake of the blue team use the up, down, left and right of the keyboard to control the direction
- The snake of the red team uses the keyboard W, S, A, D to control the direction
- Every time the snake grows by one square, the team score increases by one
- At the end of the game countdown, the team with the highest score wins
- During the game, the snake will die if it collides with the wall or its body
- During the game, if all snakes of one team die, the other team wins directly
- Yellow food can add one point, green food can increase two point
