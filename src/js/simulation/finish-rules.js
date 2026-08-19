const checkSurvivingTeam = function (snakes) {
    const aliveTeams = new Set();
    snakes.forEach((snake) => {
        if (snake.alive) {
            aliveTeams.add(snake.team);
        }
    });

    if (aliveTeams.size !== 1) {
        return null;
    }

    const winner = aliveTeams.values().next().value;
    return {winner, reason: 'survival'};
};

const checkTimeExpiry = function (state) {
    if (state.remainingTicks > 0) {
        return null;
    }

    const blueScore = state.scores['a-team'] || 0;
    const redScore = state.scores['b-team'] || 0;

    if (blueScore > redScore) {
        return {winner: 'a-team', reason: 'time'};
    }
    if (redScore > blueScore) {
        return {winner: 'b-team', reason: 'time'};
    }
    return {winner: null, reason: 'draw'};
};

export {
    checkSurvivingTeam,
    checkTimeExpiry,
};
