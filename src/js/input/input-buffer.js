const DEFAULT_INPUT_BUFFER_SIZE = 32;

class InputBuffer {
    constructor(maxSize = DEFAULT_INPUT_BUFFER_SIZE) {
        if (!Number.isInteger(maxSize) || maxSize <= 0) {
            throw new RangeError('InputBuffer maxSize must be a positive integer.');
        }

        this.maxSize = maxSize;
        this.commands = [];
    }

    push(command) {
        if (!command || typeof command !== 'object' || Array.isArray(command)) {
            throw new TypeError('InputBuffer only accepts command objects.');
        }

        if (this.commands.length === this.maxSize) {
            this.commands.shift();
        }

        this.commands.push({...command});
        return this.commands.length;
    }

    drain() {
        const commands = this.commands;
        this.commands = [];
        return commands;
    }

    clear() {
        this.commands = [];
    }

    size() {
        return this.commands.length;
    }
}

const inputBuffer = new InputBuffer();

export {
    DEFAULT_INPUT_BUFFER_SIZE,
    InputBuffer,
    inputBuffer,
};
