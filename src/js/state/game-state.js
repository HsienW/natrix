const GAME_STATE_VERSION = 1;

const createEmptyScores = function () {
    return {'a-team': 0, 'b-team': 0};
};

export {
    GAME_STATE_VERSION,
    createEmptyScores,
};
