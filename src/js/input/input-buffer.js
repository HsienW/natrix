import {getCurrentTime, readClock} from '../telemetry/clock.js';

const DEFAULT_INPUT_BUFFER_SIZE = 32;

class InputBuffer {
    constructor(maxSize = DEFAULT_INPUT_BUFFER_SIZE, now = getCurrentTime) {
        if (!Number.isInteger(maxSize) || maxSize <= 0) {
            throw new RangeError('InputBuffer maxSize must be a positive integer.');
        }
        if (typeof now !== 'function') {
            throw new TypeError('InputBuffer now must be a function.');
        }

        this.maxSize = maxSize;
        this.now = now;
        this.bufferedInputs = [];
    }

    push(command) {
        if (!command || typeof command !== 'object' || Array.isArray(command)) {
            throw new TypeError('InputBuffer only accepts command objects.');
        }

        if (this.bufferedInputs.length === this.maxSize) {
            this.bufferedInputs.shift();
        }

        this.bufferedInputs.push({
            command: {...command},
            receivedAt: readClock(this.now),
        });
        return this.bufferedInputs.length;
    }

    drain() {
        return this.drainEntries().map(function (entry) {
            return entry.command;
        });
    }

    drainEntries() {
        const entries = this.bufferedInputs;
        this.bufferedInputs = [];
        return entries;
    }

    clear() {
        this.bufferedInputs = [];
    }

    size() {
        return this.bufferedInputs.length;
    }
}

const inputBuffer = new InputBuffer();

export {
    DEFAULT_INPUT_BUFFER_SIZE,
    InputBuffer,
    inputBuffer,
};
