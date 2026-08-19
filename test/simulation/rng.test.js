const {mulberry32, createRng, nextRngState} = require('../../src/js/simulation/rng.js');

describe('mulberry32 seeded RNG', () => {
    test('produces values in [0, 1)', () => {
        const rng = mulberry32(42);
        for (let i = 0; i < 1000; i++) {
            const v = rng();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });

    test('same seed produces identical sequence', () => {
        const rngA = mulberry32(12345);
        const rngB = mulberry32(12345);
        for (let i = 0; i < 100; i++) {
            expect(rngA()).toBe(rngB());
        }
    });

    test('different seeds produce different sequences', () => {
        const rngA = mulberry32(1);
        const rngB = mulberry32(2);
        const valuesA = Array.from({length: 10}, () => rngA());
        const valuesB = Array.from({length: 10}, () => rngB());
        expect(valuesA).not.toEqual(valuesB);
    });

    test('createRng is an alias for mulberry32', () => {
        const rngA = createRng(99);
        const rngB = mulberry32(99);
        expect(rngA()).toBe(rngB());
    });

    test('nextRngState advances the seed deterministically', () => {
        const next1 = nextRngState(0);
        const next2 = nextRngState(next1);
        expect(typeof next1).toBe('number');
        expect(typeof next2).toBe('number');
        expect(next1).not.toBe(0);
        expect(next2).not.toBe(next1);
    });

    test('two simulations with same seed produce identical results', () => {
        const rngA = mulberry32(7);
        const rngB = mulberry32(7);
        const valuesA = Array.from({length: 50}, () => rngA());
        const valuesB = Array.from({length: 50}, () => rngB());
        expect(valuesA).toEqual(valuesB);
    });
});
