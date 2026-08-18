const {snakeDeadRuleChecker, halfwayFinishRuleChecker} = require('../../src/js/checker/checker.js');

describe('legacy rule baseline', () => {
    test('kills a snake outside the 41 by 41 map', () => {
        expect(snakeDeadRuleChecker({x: 0, y: 1}, [{x: 0, y: 1}])).toBe('dead');
        expect(snakeDeadRuleChecker({x: 42, y: 1}, [{x: 42, y: 1}])).toBe('dead');
    });

    test('kills a snake whose head collides with its body', () => {
        const snakeBody = [
            {x: 5, y: 5},
            {x: 5, y: 5},
        ];

        expect(snakeDeadRuleChecker(snakeBody[0], snakeBody)).toBe('dead');
    });

    test('returns the only surviving team as the halfway winner', () => {
        const blueTeam = [{snakeDead: false, snakeTeam: 'a-team'}];
        const redTeam = [{snakeDead: true, snakeTeam: 'b-team'}];

        expect(halfwayFinishRuleChecker({
            'a-team': blueTeam,
            'b-team': redTeam,
        })).toEqual([blueTeam]);
    });
});
