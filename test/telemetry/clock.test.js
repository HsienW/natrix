const {
    calculateElapsedTime,
    readClock,
} = require('../../src/js/telemetry/clock.js');

describe('telemetry clock', () => {
    test('returns null instead of exposing a clock failure', () => {
        expect(readClock(() => {
            throw new Error('clock unavailable');
        })).toBeNull();
        expect(readClock(() => Number.NaN)).toBeNull();
        expect(readClock(null)).toBeNull();
    });

    test('calculates only valid forward elapsed time', () => {
        expect(calculateElapsedTime(10, 25)).toBe(15);
        expect(calculateElapsedTime(25, 10)).toBeNull();
        expect(calculateElapsedTime(null, 10)).toBeNull();
    });
});
