const {InputBuffer} = require('../../src/js/input/input-buffer.js');

describe('InputBuffer', () => {
    test('drains commands in FIFO order and clears the queue', () => {
        const buffer = new InputBuffer(3);
        const firstCommand = {type: 'FIRST'};
        const secondCommand = {type: 'SECOND'};

        buffer.push(firstCommand);
        buffer.push(secondCommand);

        expect(buffer.size()).toBe(2);
        expect(buffer.drain()).toEqual([firstCommand, secondCommand]);
        expect(buffer.size()).toBe(0);
        expect(buffer.drain()).toEqual([]);
    });

    test('drops the oldest command when capacity is reached', () => {
        const buffer = new InputBuffer(2);

        buffer.push({type: 'FIRST'});
        buffer.push({type: 'SECOND'});
        buffer.push({type: 'THIRD'});

        expect(buffer.drain()).toEqual([
            {type: 'SECOND'},
            {type: 'THIRD'},
        ]);
    });

    test('clears buffered commands explicitly', () => {
        const buffer = new InputBuffer();
        buffer.push({type: 'COMMAND'});

        buffer.clear();

        expect(buffer.size()).toBe(0);
    });

    test('rejects invalid capacity and command values', () => {
        expect(() => new InputBuffer(0)).toThrow(RangeError);
        expect(() => new InputBuffer().push(null)).toThrow(TypeError);
    });
});
