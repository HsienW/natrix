import {createSnapshot} from '../state/snapshot.js';

const createRenderSnapshot = function (state) {
    return createSnapshot(state);
};

export {
    createRenderSnapshot,
};
