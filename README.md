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
