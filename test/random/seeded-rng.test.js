const {
    createSeededRng,
    nextRandomValue,
} = require('../../src/js/random/seeded-rng.js');

describe('seeded RNG', () => {
    test('produces the known Mulberry32 sequence for seed zero', () => {
        const random = createSeededRng(0);

        expect([random(), random(), random(), random()]).toEqual([
            0.26642920868471265,
            0.0003297457005828619,
            0.2232720274478197,
            0.1462021479383111,
        ]);
    });

    test('produces values in [0, 1)', () => {
        const random = createSeededRng(42);

        for (let i = 0; i < 1000; i++) {
            const value = random();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });

    test('same seed produces an identical sequence', () => {
        const randomA = createSeededRng(12345);
        const randomB = createSeededRng(12345);

        expect(Array.from({length: 100}, () => randomA())).toEqual(
            Array.from({length: 100}, () => randomB()),
        );
    });

    test('different seeds produce different sequences', () => {
        const randomA = createSeededRng(1);
        const randomB = createSeededRng(2);

        expect(Array.from({length: 10}, () => randomA())).not.toEqual(
            Array.from({length: 10}, () => randomB()),
        );
    });

    test('continues the same sequence from its serialized state', () => {
        const random = createSeededRng(0);
        random();
        random();

        const resumed = nextRandomValue(random.getState());

        expect(resumed.value).toBe(random());
        expect(resumed.nextState).toBe(random.getState());
    });
});
