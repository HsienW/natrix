const {
    createSeededRng,
    nextRandomValue,
} = require('../../src/js/random/seeded-rng.js');

describe('seeded RNG', () => {
    test('produces the known sequence for seed zero', () => {
        const randomGenerator = createSeededRng(0);

        expect([
            randomGenerator.next(),
            randomGenerator.next(),
            randomGenerator.next(),
            randomGenerator.next(),
        ]).toEqual([
            0.000017,
            0.000714,
            0.029291,
            0.200948,
        ]);
    });

    test('produces values in [0, 1)', () => {
        const randomGenerator = createSeededRng(42);

        for (let i = 0; i < 1000; i++) {
            const value = randomGenerator.next();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });

    test('same seed produces an identical sequence', () => {
        const randomGeneratorA = createSeededRng(12345);
        const randomGeneratorB = createSeededRng(12345);

        expect(Array.from({length: 100}, () => randomGeneratorA.next())).toEqual(
            Array.from({length: 100}, () => randomGeneratorB.next()),
        );
    });

    test('different seeds produce different sequences', () => {
        const randomGeneratorA = createSeededRng(1);
        const randomGeneratorB = createSeededRng(2);

        expect(Array.from({length: 10}, () => randomGeneratorA.next())).not.toEqual(
            Array.from({length: 10}, () => randomGeneratorB.next()),
        );
    });

    test('normalizes negative and non-integer seeds', () => {
        expect(createSeededRng(-1).getState()).toBe(999999);
        expect(createSeededRng(12.75).getState()).toBe(12);
    });

    test('continues the same sequence from its serialized state', () => {
        const randomGenerator = createSeededRng(0);
        randomGenerator.next();
        randomGenerator.next();

        const resumed = nextRandomValue(randomGenerator.getState());

        expect(resumed.value).toBe(randomGenerator.next());
        expect(resumed.nextState).toBe(randomGenerator.getState());
    });
});
