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

Phase 0 is complete. The current Phase 1 work establishes the PR-03 input boundary without changing the original two-team controls or gameplay rules.

```text
KeyboardEvent
    -> KeyboardInput
    -> bounded InputBuffer
    -> legacy simulation update
    -> Snake.changeDirection()
```

- Browser keyboard codes are translated into logical `CHANGE_DIRECTION` commands.
- Snake instances no longer own `window` keyboard listeners.
- Commands remain buffered while paused and are applied by the next simulation update.
- Restarting a match does not register duplicate keyboard listeners.
- Fixed-timestep loop infrastructure is present but remains disconnected from gameplay until the planned PR-05 integration.

Phase 1 is not complete yet. The GameState / Simulation boundary, fixed-timestep integration, and explicit runtime lifecycle remain planned for PR-04 through PR-06.

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
