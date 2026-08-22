/** @jest-environment node */

const {createInitialGameState} = require('../../src/js/simulation/create-initial-state.js');
const {
    clampInterpolationAlpha,
    createInterpolatedRenderSnapshot,
    createRenderSnapshot,
} = require('../../src/js/render/render-model.js');

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

    test('clamps interpolation alpha to the render frame range', () => {
        expect(clampInterpolationAlpha(Number.NaN)).toBe(0);
        expect(clampInterpolationAlpha(Number.NEGATIVE_INFINITY)).toBe(0);
        expect(clampInterpolationAlpha(0.5)).toBe(0.5);
        expect(clampInterpolationAlpha(1.25)).toBe(1);
    });

    test('creates an interpolated render snapshot without changing authoritative snapshots', () => {
        const previousSnapshot = {
            tick: 4,
            mapSize: 41,
            remainingSeconds: 60,
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    body: [{x: 10, y: 10}, {x: 9, y: 10}],
                    style: 'a-snake-body',
                },
            ],
            food: [
                {
                    id: 'food-0',
                    type: 'general',
                    position: {x: 3, y: 4},
                    style: 'general-expand-food',
                },
            ],
            score: {blue: 1, red: 0},
            finished: false,
            winner: null,
        };
        const currentSnapshot = {
            ...previousSnapshot,
            tick: 5,
            snakes: [
                {
                    ...previousSnapshot.snakes[0],
                    body: [{x: 11, y: 10}, {x: 10, y: 10}],
                },
            ],
        };

        const interpolatedSnapshot = createInterpolatedRenderSnapshot(
            previousSnapshot,
            currentSnapshot,
            0.5,
        );

        expect(interpolatedSnapshot.tick).toBe(5);
        expect(interpolatedSnapshot.snakes[0].body).toEqual([
            {x: 10.5, y: 10},
            {x: 9.5, y: 10},
        ]);
        expect(interpolatedSnapshot.food[0].position).toEqual({x: 3, y: 4});
        expect(currentSnapshot.snakes[0].body[0]).toEqual({x: 11, y: 10});
        expect(interpolatedSnapshot.snakes[0].body[0])
            .not.toBe(currentSnapshot.snakes[0].body[0]);
    });
});
