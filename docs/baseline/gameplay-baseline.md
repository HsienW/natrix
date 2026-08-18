# Legacy Gameplay Baseline

Reference tag: `legacy-v1.0.0`
Reference commit: `7f2e8b1861698370d04a31a81b282b43b37f273f`

This document freezes observable gameplay before runtime modernization. It is a regression contract, not a description of the target architecture.

## World and match configuration

- The map is a 41 by 41 CSS Grid.
- A short match starts with a 60-second countdown.
- One blue snake (`a-team`) and one red snake (`b-team`) are created.
- Each snake starts at a random in-bounds position with direction `{x: 0, y: 0}`.
- The initial food count is randomly selected from 1 through 4 once per page load.
- Yellow/general food grows a snake by one cell and adds one team point.
- Green/mega food grows a snake by two cells and adds two team points.

## Controls

| Team | Keys |
| --- | --- |
| Blue (`a-team`) | Arrow Up, Arrow Down, Arrow Left, Arrow Right |
| Red (`b-team`) | W, A, S, D |

## Lifecycle and finish conditions

- Start initializes roles, scores, and countdown, then starts animation and countdown loops.
- Pause cancels the active animation and countdown callbacks.
- Start while paused resumes both callbacks.
- The manual Finish action is available from the paused state.
- Reaching zero seconds finishes the match and compares team scores.
- A snake dies after leaving the map or colliding with its own body.
- If exactly one team still has a living snake, that team wins immediately.

## Legacy frame behavior

The current game already uses `requestAnimationFrame`. Simulation, rendering, collision checks, team checks, and scheduling still share the same loop. Movement updates after roughly 100 ms at the default speed, while the map DOM is cleared and recreated for each rendered update.

## Automated smoke contract

The Phase 0 smoke suite verifies that:

1. Initial countdown and scores render.
2. Start creates roles and schedules gameplay.
3. Keyboard input changes both snake directions.
4. Snakes move and can eat food.
5. Team scores and DOM role elements update.
6. Pause cancels active callbacks.
7. Resume schedules new callbacks.
8. Finish returns the game to its finished state.
9. Rule tests cover wall collision, self-collision, and sole-survivor finish logic.
