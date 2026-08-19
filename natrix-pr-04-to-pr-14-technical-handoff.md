# Natrix PR-04 to PR-14 Technical Handoff

> Status: implementation plan for unfinished M1, M2, and M3 work  
> Audience: coding agents and contributors continuing the runtime modernization  
> Scope: PR-04 through PR-14 only  
> Runtime constraint: Vanilla JavaScript, browser-native APIs, no runtime framework

## 1. How to use this document

Execute one PR at a time and keep every PR independently reviewable. Before editing:

1. Inspect the current branch, `origin/master`, and open PRs.
2. Re-run `npm test` and `npm run build`.
3. Confirm the preceding PR has been merged or is the explicit base of a stacked PR.
4. Reconcile this plan with the current source tree. Current code is authoritative when it has moved forward intentionally.
5. Do not combine adjacent PRs merely because their files overlap.

Every PR must finish with:

```powershell
npm test
npm run build
git diff --check
```

Use English Conventional Commit messages with a subject, explanatory body, and concrete bullet list. Do not use issue section numbers as commit subjects.

## 2. Repository state assumed by this plan

### Completed foundation

- M0 baseline, tooling, Jest, gameplay smoke coverage, and server verification exist.
- PR-03 buffered input work exists on the current correction branch:
  - browser keys become logical `CHANGE_DIRECTION` commands;
  - commands enter a bounded FIFO `InputBuffer`;
  - `KeyboardInput` is the only production owner of the `keydown` listener;
  - Snake state changes only when the legacy simulation update drains commands;
  - stable player IDs are `a-snake` and `b-snake`.

### Sequencing exception already present

`src/js/runtime/fixed-timestep-loop.js` and its unit tests landed early in `master` under the wrong roadmap PR label. The loop is infrastructure for PR-05 and is not connected to gameplay yet.

Do not revert and re-add it. PR-05 must audit and reuse it.

### Legacy coupling still present after PR-03

- `main-game-animation.js` owns scheduling, simulation updates, rendering, and rule checks.
- `main-game-countdown.js` owns a second `requestAnimationFrame` loop.
- Snake, Food, Map, score, countdown, and winner handling are spread across role objects, mediators, views, and DOM operations.
- `Math.random()` controls initial Snake positions, food amount, food type, and food positions.
- rendering clears and rebuilds `#game-map` using DOM nodes.
- the current State Pattern enforces invalid actions mainly through `console.log` branches.

### Branch warning

The existing unmerged `v2.0.0/refactor/pr-04-game-runtime-integration` commit was created before the corrected PR-03 and implements legacy fixed-loop integration rather than the planned PR-04 GameState boundary. Treat it as a reference only. Do not merge or cherry-pick it blindly.

## 3. Non-negotiable behavior and architecture rules

### Preserve gameplay

- Map size remains 41 by 41.
- Blue/A team controls remain Arrow keys.
- Red/B team controls remain W/A/S/D.
- Initial direction remains stationary.
- Reverse-direction input remains allowed until a separately approved rule change.
- Yellow/general food grows a Snake by one and green/mega food by two.
- Food may be awarded to both Snakes when both heads occupy its position, matching legacy behavior.
- Wall and self-body collision kill a Snake.
- The only surviving team wins immediately.
- Countdown expiry selects the highest score; equal score remains a draw.

### Keep layers one-way

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
        -> DOM or Canvas only
```

Forbidden dependencies after PR-04:

- `simulation/` must not import `window`, `document`, `requestAnimationFrame`, renderer modules, views, or mediators.
- `state/` must not import browser or renderer modules.
- input modules must not import Snake, Food, role mediators, or renderers.
- renderers must not mutate authoritative GameState.

### Avoid premature scope

- No React, Vue, TypeScript, game framework, ECS, Worker, or OffscreenCanvas work.
- No replay UI in PR-09 unless the core runner and tests are already complete.
- No interpolation in PR-13 unless static Canvas rendering and tests are complete.
- No performance claims before the later benchmark milestone.

## 4. Cross-PR contracts

These contracts should remain stable from the PR that introduces them. Later PRs may extend them additively but should avoid gratuitous renames.

### 4.1 GameState

PR-04 should establish a serializable state shape similar to:

```js
{
  version: 1,
  tick: 0,
  config: {
    mapSize: 41,
    tickRate: 10,
    durationTicks: 600
  },
  remainingTicks: 600,
  snakes: [
    {
      id: 'a-snake',
      team: 'a-team',
      alive: true,
      direction: {x: 0, y: 0},
      body: [{x: 1, y: 1}],
      pendingGrowth: 0,
      style: 'a-snake-body'
    }
  ],
  food: [
    {
      id: 'food-0',
      type: 'general-expand-food',
      position: {x: 1, y: 1},
      bodyGrowth: 1,
      style: 'general-expand-food'
    }
  ],
  scores: {
    'a-team': 0,
    'b-team': 0
  },
  finished: false,
  winner: null,
  finishReason: null,
  rngState: null
}
```

Rules:

- Store plain data only. No DOM nodes, class instances, functions, timers, or event objects.
- Use `{x, y}` integer grid positions.
- Keep runtime lifecycle state out of GameState. `RUNNING` and `PAUSED` belong to PR-06 runtime state, while `finished` and `winner` describe match outcome.
- `rngState` may be `null` in PR-04 and becomes authoritative in PR-07.

### 4.2 Simulation step

```js
const result = stepGame(previousState, commands, environment);

result.state;
result.events;
```

Requirements:

- Do not mutate `previousState`, command objects, or environment inputs.
- Increment exactly one logical tick per call while the match is active.
- Apply same-tick commands in array order.
- Preserve legacy update ordering:
  1. validate and apply direction commands;
  2. resolve food at current head positions;
  3. apply pending growth and move Snakes;
  4. resolve wall and self-body deaths;
  5. resolve immediate surviving-team finish;
  6. advance countdown and resolve time expiry;
  7. increment tick and emit domain events.
- Return events such as `SCORE_CHANGED`, `FOOD_EATEN`, `SNAKE_DIED`, and `MATCH_FINISHED`. UI side effects consume events outside simulation.
- A finished match must not advance on later calls.

### 4.3 Logical tick convention

`state.tick` is the tick about to execute. Commands drained for an update are recorded against that value, then passed to `stepGame`, which produces a state with `tick + 1`.

This convention must be shared by PR-05 runtime updates, PR-08 recording, PR-09 replay, and PR-10 state-hash fixtures.

### 4.4 RenderSnapshot

```js
{
  tick: 10,
  mapSize: 41,
  remainingSeconds: 59,
  snakes: [
    {
      id: 'a-snake',
      team: 'a-team',
      alive: true,
      body: [{x: 2, y: 1}],
      style: 'a-snake-body'
    }
  ],
  food: [
    {
      id: 'food-0',
      type: 'general-expand-food',
      position: {x: 5, y: 5},
      style: 'general-expand-food'
    }
  ],
  score: {
    blue: 1,
    red: 0
  },
  finished: false,
  winner: null
}
```

The snapshot is a read-only projection. Renderer-specific colors, Canvas contexts, DOM nodes, and interpolation state do not belong in GameState.

### 4.5 Runtime transition result

```js
{
  ok: true,
  action: 'PAUSE',
  from: 'RUNNING',
  to: 'PAUSED'
}
```

Invalid example:

```js
{
  ok: false,
  code: 'INVALID_RUNTIME_TRANSITION',
  action: 'START',
  from: 'RUNNING',
  to: 'RUNNING'
}
```

### 4.6 Replay payload

```json
{
  "version": 1,
  "seed": 123456,
  "config": {
    "mapSize": 41,
    "tickRate": 10,
    "durationTicks": 600
  },
  "commands": [
    {
      "tick": 12,
      "playerId": "a-snake",
      "type": "CHANGE_DIRECTION",
      "direction": "LEFT"
    }
  ]
}
```

Array order preserves the order of commands sharing the same tick.

### 4.7 Renderer contract

```js
renderer.init(config);
renderer.render(snapshot, meta);
renderer.resize(viewport);
renderer.destroy();
```

`meta` should initially contain only runtime render metadata:

```js
{
  alpha: 0.5,
  frameTimestamp: 1234.5
}
```

Do not put authoritative state in `meta`.

## 5. Dependency sequence

```text
Corrected PR-03 buffered commands
        -> PR-04 GameState / Simulation
        -> PR-05 fixed-timestep integration
        -> PR-06 lifecycle cleanup
        -> PR-07 seeded RNG
        -> PR-08 command recording
        -> PR-09 replay runner
        -> PR-10 state-hash suite
        -> PR-11 renderer contract
        -> PR-12 DOMRenderer
        -> PR-13 CanvasRenderer
        -> PR-14 DPR / resize hardening
```

Do not start M2 before PR-06 is merged. Do not start Canvas work before the renderer contract and DOM reference renderer are merged.

## 6. PR-04 — GameState / Simulation boundary

### Objective

Make authoritative gameplay step manually without DOM, wall-clock time, rendering, or `requestAnimationFrame`.

### Prerequisites

- Corrected PR-03 is merged or used as the explicit base.
- Baseline and buffered-input tests pass.

### Proposed files

Add:

```text
src/js/state/game-state.js
src/js/state/snapshot.js
src/js/simulation/create-initial-state.js
src/js/simulation/step-game.js
src/js/simulation/apply-commands.js
src/js/simulation/movement.js
src/js/simulation/collision.js
src/js/simulation/scoring.js
src/js/simulation/finish-rules.js
src/js/simulation/simulation.js
test/simulation/create-initial-state.test.js
test/simulation/step-game.test.js
test/simulation/simulation-boundary.test.js
```

Modify as migration seams require:

```text
src/js/main/main-game-animation.js
src/js/main/main-game-countdown.js
src/js/main/main-view.js
src/js/mediator/main-game-mediator.js
src/js/mediator/role-item-mediator.js
src/js/mediator/team-mediator.js
src/js/role/snake.js
src/js/role/food.js
test/smoke/gameplay-smoke.test.js
```

### Implementation plan

1. Define `createInitialGameState(config, environment)` using plain data.
2. Use an injected transitional random source in PR-04. The browser bootstrap may wrap `Math.random`, but simulation modules must not call it directly. PR-07 replaces this adapter with seeded state.
3. Implement `stepGame(state, commands, environment)` using the shared step contract.
4. Move direction application, movement, growth, food collision, scoring, Snake death, team survival, countdown, and match finish into pure helpers.
5. Implement `createSnapshot(state)` without DOM access.
6. Replace UI side effects inside score and finish rules with returned domain events.
7. Keep the existing browser scheduling temporarily, but make it call `simulation.step()` and a separate render projection. PR-05 owns scheduling replacement.
8. If a temporary DOM projection is required, keep it in `main/` and label it as a migration seam. PR-12 will move it into `DOMRenderer`.
9. Remove authoritative gameplay ownership from role mediators only after the smoke test passes through the new GameState path.

### Required tests

- Initial state contains the two teams, configured food, scores, countdown, and stationary directions.
- Calling `stepGame` manually advances exactly one tick without rAF.
- Rendering can be omitted entirely while movement, food, score, death, and finish still work.
- Input state and previous GameState are not mutated.
- Same-tick command ordering matches PR-03 buffer ordering.
- Legacy movement, food growth, wall collision, self collision, halfway finish, time finish, and draw behavior remain covered.
- At least one simulation test uses `/** @jest-environment node */` to prove JSDOM is unnecessary.

### Exit criteria

- Simulation can be stepped manually without rAF.
- Rendering can be disabled and simulation still works.
- `simulation/` and `state/` contain no browser globals or DOM imports.
- Browser smoke behavior remains intact.

### Out of scope

- Seeded RNG algorithm.
- Command recording or replay.
- Formal renderer interface.
- Canvas rendering.

### Handoff note for PR-05

Document the exact functions that represent `step`, `snapshot`, `reset`, and event consumption. PR-05 must call these functions rather than legacy role update methods.

## 7. PR-05 — Accumulator-based fixed-timestep GameLoop

### Objective

Connect the PR-04 simulation to one accumulator-based browser loop while keeping render cadence independent from the 10 Hz simulation rate.

### Existing asset to reuse

Audit and reuse:

```text
src/js/runtime/fixed-timestep-loop.js
test/runtime/fixed-timestep-loop.test.js
```

Do not add a second fixed-loop implementation.

### Proposed files

Add:

```text
src/js/runtime/game-runtime.js
test/runtime/game-runtime.test.js
test/runtime/refresh-rate-parity.test.js
```

Modify or retire:

```text
src/js/main/main-game-animation.js
src/js/main/main-game-countdown.js
src/js/mediator/main-game-mediator.js
test/smoke/gameplay-smoke.test.js
```

### Implementation plan

1. Audit the landed loop for `100 ms` step size, `250 ms` elapsed clamp, accumulator correctness, injected scheduling functions, and safe stop-inside-update behavior.
2. Create `GameRuntime` that owns the current GameState and composes:
   - `FixedTimestepLoop`;
   - `simulation.step(stepMs)`;
   - `simulation.snapshot()`;
   - a render callback;
   - domain event delivery.
3. Drain input commands once per fixed simulation step, not once per render frame.
4. Move countdown progression into logical ticks. Remove the second countdown rAF loop.
5. Render once per browser frame with `alpha = accumulator / stepMs`.
6. Keep renderer injection as a callback or narrow adapter. PR-11 introduces the formal renderer contract.
7. Ensure stopping during a simulation step still permits one final render snapshot but schedules no further frame.

### Required tests

- 60 Hz, 120 Hz, and 144 Hz timestamp sequences covering the same elapsed duration produce the same tick count and state.
- Long elapsed time is clamped and does not cause unbounded catch-up.
- Multiple fixed steps may run before one render.
- A render may run with zero simulation steps.
- Input commands are consumed on a logical step, never merely because a frame rendered.
- Countdown advances by ticks and pauses with simulation.
- Only one rAF owner exists after integration.

### Exit criteria

- Fixed timestep is active in gameplay.
- Display refresh rate does not change authoritative speed.
- Update and render callbacks are independently measurable.
- `main-game-countdown.js` no longer owns an animation loop.

### Out of scope

- Formal lifecycle transition table; PR-06 owns it.
- Seeded RNG and replay.
- Renderer switching.

### Handoff note for PR-06

Expose narrow `startLoop`, `pauseLoop`, `stopLoop`, `resetSimulation`, and `isLoopRunning` operations. Do not let UI controls call `requestAnimationFrame` directly.

## 8. PR-06 — Explicit runtime lifecycle state machine

### Objective

Replace console-only State Pattern branches with an explicit, testable runtime lifecycle that cannot create duplicate loops.

### Proposed files

Add:

```text
src/js/runtime/runtime-state.js
src/js/runtime/runtime-state-machine.js
test/runtime/runtime-state-machine.test.js
test/runtime/runtime-lifecycle.integration.test.js
```

Modify or retire:

```text
src/js/main/main-game-state.js
src/js/main/main.js
src/js/main/main-view.js
src/js/mediator/main-game-mediator.js
src/js/runtime/game-runtime.js
test/smoke/gameplay-smoke.test.js
README.md
```

### State model

States:

```text
IDLE
RUNNING
PAUSED
FINISHED
```

Actions and allowed transitions:

| From | Action | To | Runtime effect |
|---|---|---|---|
| IDLE | START | RUNNING | initialize if needed, start loop |
| RUNNING | PAUSE | PAUSED | pause loop, preserve accumulator/state |
| RUNNING | FINISH | FINISHED | stop loop, preserve final snapshot |
| PAUSED | RESUME | RUNNING | restart one loop without paused elapsed time |
| PAUSED | FINISH | FINISHED | stop and finalize |
| FINISHED | RESET | IDLE | reset simulation, events, and input buffer |

The Start button in `FINISHED` may orchestrate `RESET` followed by `START`; do not add an undocumented direct transition.

### Implementation plan

1. Implement a transition table with structured success and failure results.
2. Make `GameRuntime.dispatch(action)` the single lifecycle entrypoint.
3. Map Start/Pause/Finish UI controls to semantic runtime actions.
4. Remove invalid-action `console.log` enforcement from the legacy state objects.
5. Keep loop scheduling effects behind successful transitions only.
6. Define event delivery for lifecycle changes so UI labels/status can update without inspecting internals.

### Required tests

- Every valid transition returns the expected result and side effect.
- Every invalid transition returns `INVALID_RUNTIME_TRANSITION` and performs no side effect.
- Duplicate `START` while running schedules no second rAF.
- Repeated `PAUSE`, `RESUME`, `FINISH`, and `RESET` calls are safe.
- Paused elapsed wall time is not added on resume.
- Reset clears input and match state.
- Browser smoke covers start, pause, resume, finish, and restart.

### Exit criteria

- Pause/resume creates no duplicate rAF loops.
- Lifecycle tests exist.
- UI controls no longer depend on console-only state enforcement.
- README truthfully describes M1 as complete.

### Out of scope

- Seed or replay controls.
- Renderer selector.

## 9. PR-07 — Seeded RNG

### Objective

Make every game-critical random decision reproducible from an explicit seed.

### Proposed files

Add:

```text
src/js/random/seeded-rng.js
src/js/random/random-state.js
src/js/random/game-random.js
test/random/seeded-rng.test.js
test/random/game-random.test.js
```

Modify:

```text
src/js/state/game-state.js
src/js/simulation/create-initial-state.js
src/js/simulation/scoring.js
src/js/common/util.js
src/js/role-config/food-type.js
test/simulation/create-initial-state.test.js
```

### Algorithm and API

Use a small, documented 32-bit algorithm with stable JavaScript integer behavior, such as Mulberry32. Do not use crypto APIs.

Required behavior:

```js
const rng = createSeededRng(seed);
rng.nextFloat();
rng.nextInt(maxExclusive);
rng.getState();
```

For fully serializable GameState, prefer a pure transition helper internally:

```js
const {value, nextState} = nextRandomUint32(rngState);
```

### Implementation plan

1. Normalize input seeds to unsigned 32-bit integers and reject unsupported values explicitly.
2. Store current RNG state in GameState.
3. Replace all game-critical randomness:
   - initial Snake positions;
   - food count;
   - food type;
   - initial food position;
   - replacement food position after eating.
4. Remove module-load random values such as a cached `initFoodAmount`.
5. Keep any non-gameplay visual randomness separate and explicitly non-authoritative.
6. Expose the match seed through runtime config for later replay payloads.

### Required tests

- Known seed produces a checked-in sequence of unsigned integers/floats.
- Same seed produces identical initial state and food relocation sequence.
- Different seeds produce a different sequence without asserting probabilistic quality.
- Boundary `nextInt` values remain inside `[0, maxExclusive)`.
- Simulation modules contain no direct `Math.random()` calls.

### Exit criteria

- Deterministic RNG is authoritative.
- Food placement and initial placement are reproducible.
- Same state, seed state, and commands produce the same next state.

### Out of scope

- Recording commands.
- Replay playback UI.

## 10. PR-08 — Record commands by simulation tick

### Objective

Record the normalized command batch consumed by each logical simulation tick.

### Proposed files

Add:

```text
src/js/replay/command-recorder.js
src/js/replay/command-log.js
test/replay/command-recorder.test.js
```

Modify:

```text
src/js/runtime/game-runtime.js
src/js/input/input-buffer.js
src/js/state/game-state.js
```

### Recording rules

- Record commands after browser mapping but before `stepGame` mutates state.
- Use `state.tick`, never browser timestamps.
- Preserve array order for multiple commands on the same tick.
- Store plain command data only.
- Do not record DOM events, renderer actions, lifecycle controls, or ignored unknown keys.
- Include every normalized player-affecting command passed to simulation, even if simulation later rejects it. This lets replay exercise the same validation path.

### API

```js
recorder.record(tick, commands);
recorder.entries();
recorder.clear();
```

Returned logs must be defensive copies or immutable values.

### Required tests

- Commands are tagged with the correct pre-step tick.
- Same-tick ordering is preserved.
- Empty steps do not create misleading records unless an explicit compact/no-op policy is documented.
- Returned entries cannot mutate recorder internals.
- Reset starts a fresh log.
- Pause/render frames create no command entries.

### Exit criteria

- Command log covers all player-affecting commands.
- Log depends on logical ticks only.

### Out of scope

- Persisting to localStorage.
- Replay execution.
- Shareable URLs.

## 11. PR-09 — Deterministic replay runner

### Objective

Reconstruct and execute a match headlessly from replay version, seed, config, and command log.

### Proposed files

Add:

```text
src/js/replay/replay-schema.js
src/js/replay/replay-codec.js
src/js/replay/replay-runner.js
src/js/replay/replay-player.js
test/replay/replay-codec.test.js
test/replay/replay-runner.test.js
```

Modify:

```text
src/js/replay/command-recorder.js
src/js/runtime/game-runtime.js
```

### Implementation plan

1. Define version `1` payload validation with required seed, config, and commands.
2. Serialize to and parse from JSON without losing command order.
3. Reject unsupported versions, invalid ticks, invalid players, malformed directions, and incompatible config.
4. Group commands by tick while preserving payload order.
5. Recreate initial state from seed/config.
6. Step synchronously without rAF or renderer until:
   - the requested final tick;
   - match finish; or
   - a documented safety limit.
7. Return final GameState, snapshots/events if requested, and executed tick count.
8. Keep optional Copy/Paste/URL UI out of the critical path.

### Required tests

- JSON round-trip preserves a valid payload exactly.
- Invalid payloads fail with stable error codes.
- Runner uses no browser APIs and works in Node Jest environment.
- Same payload run twice produces deeply equal final states.
- Same-tick command order matches live runtime behavior.
- Replay stops deterministically on finish or target tick.

### Exit criteria

- A match can be reproduced from seed and commands.
- Core replay execution is headless.

### Out of scope

- Playback animation controls.
- Compression and URL encoding.

## 12. PR-10 — State-hash regression suite

### Objective

Create a stable regression fingerprint proving that live simulation and replay produce the same authoritative final state.

### Proposed files

Add:

```text
src/js/state/canonical-state.js
src/js/state/state-hash.js
test/fixtures/deterministic-replay-v1.js
test/replay/state-hash.test.js
test/replay/deterministic-regression.test.js
```

### Hash contract

1. Canonicalize object keys recursively.
2. Preserve array order.
3. Include authoritative state:
   - tick and remaining ticks;
   - Snake positions, direction, alive state, and growth;
   - food IDs/types/positions;
   - scores, winner, and finish reason;
   - RNG state;
   - deterministic config.
4. Exclude DOM, renderer selection, interpolation alpha, frame timestamps, runtime metrics, and transient UI status.
5. Use a simple documented deterministic hash such as FNV-1a 32-bit. Cryptographic security is not required.

### Fixture policy

- Check in a real seed, config, command stream, tick count, final summary, and generated expected hash.
- Generate expected values from the implementation once and review them. Do not invent values in advance.
- Changing an expected hash requires a written explanation of the intended state-semantic change.

### Required tests

- Canonicalization ignores object insertion order.
- Meaningful state changes alter the hash.
- Non-authoritative render metadata does not affect the hash because it is excluded before hashing.
- Live command execution and replay execution produce the same hash.
- The same fixture remains stable across repeated runs without JSDOM.

### Exit criteria

- Seeded initial state and food placement are reproducible.
- Command log and replay runner are covered.
- Live and replay final hashes match.
- Simulation regression tests run without browser rendering.

### M2 completion check

Do not mark M2 complete unless PR-07 through PR-10 all pass together from a clean clone.

### Out of scope

- Replay playback UI and timeline controls.
- Performance benchmarking or renderer comparison.
- Cryptographic integrity or anti-tamper guarantees.

## 13. PR-11 — Renderer contract

### Objective

Make runtime rendering depend on a minimal renderer interface and a stable RenderSnapshot, not DOM implementation details.

### Proposed files

Add:

```text
src/js/render/renderer.js
src/js/render/renderer-host.js
src/js/render/render-model.js
src/js/render/null-renderer.js
test/render/renderer-contract.test.js
test/render/renderer-host.test.js
test/render/render-model.test.js
```

Modify:

```text
src/js/runtime/game-runtime.js
src/js/state/snapshot.js
src/js/main/main.js
```

### Contract strategy

JavaScript has no interface keyword. Use JSDoc typedefs plus a small runtime assertion at composition boundaries. Do not create an inheritance hierarchy solely to imitate another language.

```js
assertRenderer(renderer);
renderer.init(config);
renderer.render(snapshot, meta);
renderer.resize(viewport);
renderer.destroy();
```

### Implementation plan

1. Stabilize `RenderSnapshot` projection in `render-model.js` or re-export the PR-04 snapshot function without duplicating shapes.
2. Add `NullRenderer` for headless runtime use.
3. Add `RendererHost` that owns exactly one renderer and guarantees `destroy()` before replacement.
4. Inject renderer/host into `GameRuntime`.
5. Permit renderer choice through bootstrap config or a query parameter. A polished selector is not required yet.
6. Remove remaining DOM imports from simulation/state modules and add a boundary test.

### Required tests

- Contract assertion accepts all four required methods and rejects incomplete objects.
- Renderer initialization occurs once.
- Swap destroys the old renderer before initializing/rendering the new one.
- NullRenderer allows headless simulation.
- RenderSnapshot contains no mutable references to authoritative state.
- Simulation tests pass when no DOM renderer exists.

### Exit criteria

- Renderer can be swapped at runtime or bootstrap time.
- Simulation has no direct DOM dependency.
- Runtime renders snapshots only through the contract.

### Out of scope

- DOMRenderer extraction.
- Canvas drawing.

## 14. PR-12 — Legacy DOMRenderer

### Objective

Move the temporary/legacy DOM world rendering behind the renderer contract without changing visual rules.

### Proposed files

Add:

```text
src/js/render/dom-renderer.js
src/js/render/game-hud.js
test/render/dom-renderer.test.js
test/render/game-hud.test.js
```

Modify or retire:

```text
src/js/main/main-game-animation.js
src/js/main/main-view.js
src/js/role/map.js
src/js/role/snake.js
src/js/role/food.js
src/js/main/main.js
test/smoke/gameplay-smoke.test.js
```

### Ownership split

```text
DOMRenderer
  -> #game-map world nodes only

GameHud
  -> score
  -> countdown
  -> winner/status
  -> Start/Pause/Finish controls remain normal DOM
```

Canvas and future renderers must not take ownership of controls or accessibility text.

### Implementation plan

1. Move map clearing, food node creation, and Snake body node creation into `DOMRenderer`.
2. Render exclusively from RenderSnapshot.
3. Preserve existing class names and grid coordinates so current CSS remains valid.
4. Move score/countdown/status projection into `GameHud` shared by all renderer modes.
5. Make `init` resolve/store required DOM roots and fail clearly when missing.
6. Make `destroy` clear world nodes and release stored references/listeners owned by the renderer.
7. Remove render methods and DOM imports from domain objects once no callers remain.

### Required tests

- DOMRenderer produces expected Snake and food node counts/classes/positions.
- Re-render replaces stale world nodes without accumulating duplicates.
- Dead Snakes are absent or represented according to snapshot contract.
- GameHud updates score/countdown/winner independently of world renderer.
- Destroy is idempotent.
- Existing gameplay smoke passes with DOMRenderer as the default.

### Exit criteria

- DOMRenderer remains fully playable as reference implementation.
- Domain and simulation modules do not create DOM nodes.

### Out of scope

- Canvas element and drawing.
- Visual redesign.

## 15. PR-13 — DPR-aware CanvasRenderer

### Objective

Add a Canvas world renderer while preserving DOM controls/HUD and authoritative simulation behavior.

### Proposed files

Add:

```text
src/js/render/canvas-renderer.js
src/js/render/canvas-palette.js
src/js/render/renderer-factory.js
test/render/canvas-renderer.test.js
test/render/renderer-factory.test.js
```

Modify:

```text
src/index.html
src/style/main.css
src/js/main/main.js
src/js/render/renderer-host.js
test/smoke/gameplay-smoke.test.js
```

### Rendering responsibilities

- map background and optional grid;
- Snake bodies using team palette;
- food using type palette;
- no Start/Pause/Finish controls inside Canvas;
- no authoritative state mutation;
- no game-rule decisions.

### Renderer selection

Support an explicit bootstrap mode, for example:

```text
?renderer=dom
?renderer=canvas
```

Default to DOM until Canvas parity is verified. Invalid values must fall back to DOM with a non-fatal diagnostic.

### DPR baseline

PR-13 should size the backing store using the current device pixel ratio and render at CSS-coordinate scale. PR-14 owns resize observation, changing DPR, zero-size handling, and cleanup hardening.

### Implementation plan

1. Add a Canvas world element without removing the DOM world root.
2. Renderer factory selects DOM or Canvas and hides the inactive world element.
3. Compute a square logical viewport and cell size from map size.
4. Set backing width/height from CSS size times DPR.
5. Reset transform before applying DPR scaling; never accumulate scale between renders.
6. Draw snapshot entities with stable colors documented in `canvas-palette.js`.
7. Keep GameHud shared and renderer-independent.
8. Skip interpolation initially. If added, keep previous/current render positions outside GameState and use runtime `alpha` only for drawing.

### Required tests

- CanvasRenderer calls expected context operations for background, food, and Snake segments.
- Logical grid coordinates map to correct cell rectangles.
- DPR changes backing-store dimensions but not logical CSS dimensions.
- Renderer never mutates snapshot input.
- Renderer factory chooses both modes and falls back safely.
- Browser smoke can initialize and play in Canvas mode.

### Manual validation

- Compare DOM and Canvas modes with the same known state/snapshot.
- Verify colors, map boundary, food type, dead Snake behavior, score, countdown, controls, and finish UI.
- Record observations only; do not publish performance claims yet.

### Exit criteria

- CanvasRenderer visually matches game rules.
- DOM mode remains the default, working fallback.

### Out of scope

- ResizeObserver lifecycle hardening.
- OffscreenCanvas.
- Performance comparison claims.

## 16. PR-14 — DPR and resize hardening

### Objective

Make Canvas rendering correct across container resize, viewport resize, and device-pixel-ratio changes without leaking observers or listeners.

### Proposed files

Add:

```text
src/js/render/canvas-viewport.js
test/render/canvas-viewport.test.js
test/render/canvas-resize.integration.test.js
```

Modify:

```text
src/js/render/canvas-renderer.js
src/js/render/renderer-host.js
src/style/main.css
```

### Viewport contract

```js
{
  cssWidth: 640,
  cssHeight: 640,
  pixelRatio: 2
}
```

### Implementation plan

1. Inject or feature-detect `ResizeObserver`; use a controlled window resize fallback only when needed.
2. Measure the renderer container rather than assuming viewport width.
3. Keep a square game world without distorting grid cells.
4. Set backing dimensions to rounded CSS dimensions times effective DPR.
5. Reset the 2D transform before DPR scaling on every resize.
6. Avoid reallocating the backing store when dimensions have not changed.
7. Handle hidden/zero-size containers without exceptions or invalid drawing.
8. Recalculate on renderer activation because an inactive hidden renderer may have measured zero size.
9. Disconnect observers and remove fallback listeners in `destroy`.
10. Ensure repeated renderer swaps do not accumulate observers.

### Required tests

- DPR 1 and DPR 2 produce expected backing dimensions.
- Logical cell geometry remains unchanged across DPR values.
- Repeated resize does not accumulate transforms.
- Zero-size viewport is handled safely and later recovers.
- Renderer activation after hidden state triggers a new measurement.
- Destroy disconnects observer/listener exactly once.
- DOM/Canvas swapping does not leak resize handlers.

### Browser validation matrix

- Chrome latest.
- Edge latest.
- Firefox latest.
- Safari latest when available.
- At least one DPR 1 display/emulation and one DPR 2 display/emulation.

### Exit criteria

- DPR behavior is tested.
- Renderer remains swappable.
- Simulation has no DOM dependency.
- Canvas and DOM modes remain functional.
- Resize lifecycle has no known listener/observer leak.

### M3 completion check

Do not mark M3 complete until PR-11 through PR-14 pass together and both renderer modes complete the browser smoke path.

### Out of scope

- OffscreenCanvas and Worker rendering.
- Runtime performance claims or benchmark publication.
- Responsive redesign outside the game-world sizing contract.

## 17. Legacy migration map

| Legacy responsibility | Current owner | Planned owner | Target PR |
|---|---|---|---|
| Keyboard mapping | `input/command-map.js` | unchanged | PR-03 complete |
| Input queue | `input/input-buffer.js` | unchanged | PR-03 complete |
| Direction mutation | Snake + role mediator | simulation command reducer | PR-04 |
| Snake movement/growth | `role/snake.js` | simulation movement | PR-04 |
| Food collision/score | Food + mediators | simulation scoring | PR-04 |
| Collision/death | Snake + checker chain | simulation collision/finish rules | PR-04 |
| Countdown | `main-game-countdown.js` rAF | GameState ticks + runtime | PR-04/PR-05 |
| Frame scheduling | `main-game-animation.js` | `FixedTimestepLoop` + `GameRuntime` | PR-05 |
| Start/pause/finish | State objects + mediator | runtime state machine | PR-06 |
| Random decisions | `Math.random()` utilities | seeded RNG state | PR-07 |
| Command history | none | command recorder | PR-08 |
| Replay | none | replay runner | PR-09 |
| Regression fingerprint | none | canonical state hash | PR-10 |
| Render API | direct method calls | renderer contract/host | PR-11 |
| DOM world | role render methods | DOMRenderer | PR-12 |
| Canvas world | none | CanvasRenderer | PR-13 |
| DPR/resize | none | Canvas viewport lifecycle | PR-14 |

Delete a legacy module only after `rg` shows no callers and the replacement has equivalent tests. Prefer an explicit removal commit inside the owning PR over leaving dead code indefinitely.

## 18. PR hygiene and branch strategy

Suggested branches:

```text
v2.0.0/refactor/pr-04-game-state-simulation-boundary
v2.0.0/feat/pr-05-fixed-timestep-game-loop
v2.0.0/refactor/pr-06-runtime-lifecycle-state-machine
v2.0.0/feat/pr-07-seeded-rng
v2.0.0/feat/pr-08-command-recording
v2.0.0/feat/pr-09-deterministic-replay
v2.0.0/test/pr-10-state-hash-regression
v2.0.0/refactor/pr-11-renderer-contract
v2.0.0/refactor/pr-12-dom-renderer
v2.0.0/feat/pr-13-canvas-renderer
v2.0.0/fix/pr-14-canvas-dpr-resize
```

PR rules:

- Base each branch on the preceding merged PR, or clearly label a stacked base.
- Keep issue objective, implementation, tests, and exit criteria in the PR body.
- Update architecture/status documentation when ownership or a public contract changes.
- Do not include generated `dist/` or coverage output.
- Do not mix formatting-only rewrites with architectural changes.
- Do not use fabricated benchmark numbers in M1–M3 PRs.

## 19. Agent handoff checklist

At the end of each PR, leave the next agent a short handoff containing:

```markdown
## Completed
- Exact behavior and contracts delivered

## Verification
- Test suites and build commands run

## Changed ownership
- Responsibilities moved from old modules to new modules

## Remaining migration seams
- Temporary adapters or legacy callers still present

## Next PR prerequisites
- APIs and files the next PR must use

## Known risks
- Browser, lifecycle, determinism, or rendering caveats
```

The handoff must state facts from the resulting repository, not repeat intended work as if it were complete.

## 20. Final acceptance summary

### M1 complete after PR-06

- Input events are buffered commands.
- GameState and simulation step are browser-independent.
- Gameplay uses one fixed-timestep loop.
- pause/resume creates no duplicate rAF.
- lifecycle transitions are explicit and tested.

### M2 complete after PR-10

- All authoritative randomness is seeded.
- commands are recorded by logical tick.
- replay runs headlessly from seed/config/commands.
- live and replay final-state hashes match.

### M3 complete after PR-14

- Runtime renders through a minimal contract.
- DOMRenderer remains playable.
- CanvasRenderer remains playable.
- DPR and resize behavior are tested and leak-free.
- simulation has no direct DOM dependency.

Only after these gates should the project proceed to runtime telemetry, deterministic benchmark, README/public demo polish, and the v2.0.0 release gate.
