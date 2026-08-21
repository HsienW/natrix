import {serializeCanonicalState} from './canonical-state.js';

const CHECKSUM_RANGE = 1000000;
const FIRST_CHECKSUM_MULTIPLIER = 31;
const SECOND_CHECKSUM_MULTIPLIER = 37;
const FIRST_CHECKSUM_START = 7;
const SECOND_CHECKSUM_START = 11;
const CHECKSUM_DIGITS = 6;

const calculateChecksum = function (text, multiplier, startValue) {
    let checksum = startValue;

    for (let index = 0; index < text.length; index++) {
        const characterCode = text.charCodeAt(index);
        checksum = (checksum * multiplier + characterCode) % CHECKSUM_RANGE;
    }

    return checksum;
};

const formatChecksum = function (checksum) {
    return String(checksum).padStart(CHECKSUM_DIGITS, '0');
};

const createStateHash = function (state) {
    const canonicalState = serializeCanonicalState(state);

    // This is a regression fingerprint, not a security hash. Two decimal
    // checksum passes keep the implementation readable without 32-bit tricks.
    const firstChecksum = calculateChecksum(
        canonicalState,
        FIRST_CHECKSUM_MULTIPLIER,
        FIRST_CHECKSUM_START,
    );
    const secondChecksum = calculateChecksum(
        canonicalState,
        SECOND_CHECKSUM_MULTIPLIER,
        SECOND_CHECKSUM_START,
    );

    return [
        canonicalState.length,
        formatChecksum(firstChecksum),
        formatChecksum(secondChecksum),
    ].join(':');
};

export {
    createStateHash,
};
