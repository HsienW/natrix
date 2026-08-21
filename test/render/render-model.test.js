/** @jest-environment node */

const {createInitialGameState} = require('../../src/js/simulation/create-initial-state.js');
const {createRenderSnapshot} = require('../../src/js/render/render-model.js');

describe('render model', () => {
    test('projects the stable RenderSnapshot shape', () => {
        const state = createInitialGameState({seed: 7});
        const snapshot = createRenderSnapshot(state);

        expect(snapshot).toEqual(expect.objectContaining({
            tick: 0,
            mapSize: 41,
            remainingSeconds: 60,
            finished: false,
            winner: null,
        }));
        expect(snapshot.snakes).toHaveLength(2);
        expect(snapshot.food.length).toBeGreaterThan(0);
        expect(snapshot.score).toEqual({blue: 0, red: 0});
    });

    test('contains no mutable references to authoritative state', () => {
        const state = createInitialGameState({seed: 7});
        const originalHeadX = state.snakes[0].body[0].x;
        const originalFoodX = state.food[0].position.x;
        const snapshot = createRenderSnapshot(state);

        snapshot.snakes[0].body[0].x = snapshot.snakes[0].body[0].x + 1;
        snapshot.food[0].position.x = snapshot.food[0].position.x + 1;

        expect(state.snakes[0].body[0].x).toBe(originalHeadX);
        expect(state.food[0].position.x).toBe(originalFoodX);

        state.snakes[0].body[0].y = state.snakes[0].body[0].y + 1;
        expect(snapshot.snakes[0].body[0].y).not.toBe(state.snakes[0].body[0].y);
    });
});
