const {CommandRecorder} = require('../../src/js/replay/command-recorder.js');

describe('CommandRecorder', () => {
    test('tags commands with the simulation tick and preserves their order', () => {
        const recorder = new CommandRecorder();
        const commands = [
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'},
            {type: 'CHANGE_DIRECTION', playerId: 'b-snake', direction: 'UP'},
        ];

        recorder.record(12, commands);

        expect(recorder.entries()).toEqual([
            {...commands[0], tick: 12},
            {...commands[1], tick: 12},
        ]);
    });

    test('does not add entries for an empty simulation step', () => {
        const recorder = new CommandRecorder();

        expect(recorder.record(4, [])).toBe(0);
        expect(recorder.entries()).toEqual([]);
    });

    test('returns copies that cannot change the recorded commands', () => {
        const recorder = new CommandRecorder();
        const command = {
            type: 'CHANGE_DIRECTION',
            playerId: 'a-snake',
            direction: 'RIGHT',
            details: {source: 'keyboard'},
        };

        recorder.record(2, [command]);
        command.details.source = 'changed-before-reading';

        const firstRead = recorder.entries();
        firstRead[0].direction = 'LEFT';
        firstRead[0].details.source = 'changed-after-reading';

        expect(recorder.entries()).toEqual([{
            type: 'CHANGE_DIRECTION',
            playerId: 'a-snake',
            direction: 'RIGHT',
            details: {source: 'keyboard'},
            tick: 2,
        }]);
    });

    test('clear starts a fresh command log', () => {
        const recorder = new CommandRecorder();
        recorder.record(0, [{type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'}]);

        recorder.clear();
        recorder.record(0, [{type: 'CHANGE_DIRECTION', playerId: 'b-snake', direction: 'LEFT'}]);

        expect(recorder.entries()).toEqual([
            {type: 'CHANGE_DIRECTION', playerId: 'b-snake', direction: 'LEFT', tick: 0},
        ]);
    });

    test('rejects invalid ticks, batches, and command values', () => {
        const recorder = new CommandRecorder();

        expect(() => recorder.record(0.5, [])).toThrow(RangeError);
        expect(() => recorder.record(0, null)).toThrow(TypeError);
        expect(() => recorder.record(0, [null])).toThrow(TypeError);
    });
});
