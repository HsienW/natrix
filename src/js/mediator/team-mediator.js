/** Mediator Pattern **/

import {noticeConfirm} from '../common/notice.js';
import {checkValueIsEmpty, checkObjectIsEmpty} from '../common/util.js';
import {halfwayFinishRuleChecker} from '../checker/checker.js';
import {mainGameMediator} from './main-game-mediator.js';
import {roleItemMediator} from './role-item-mediator.js';

// teamMediator 負責中介管理團隊相關的行為
// 例如: 初始計分、團隊加分、團隊勝利判定等等...

const teamMediator = (function () {
    let allTeamScore = {};
    let winTeam = {};
    const operations = {};

    operations.initTeamScore = function () {
        const allSnake = roleItemMediator.getData('getAllSnake');

        for (let team in allSnake) {
            allTeamScore[team] = 0;
        }
    }

    operations.addTeamScore = function (snake, score) {
        const team = snake.getSnakeTeam();
        const isDead = snake.getSnakeDead();

        if (!isDead && checkValueIsEmpty(allTeamScore[team])) {
            allTeamScore[team] = score;
            console.log(allTeamScore);
            return;
        }
        allTeamScore[team] = allTeamScore[team] + score;
    }

    operations.clearTeamScore = function () {
        allTeamScore = {};
    }

    operations.compareTeamTotalScore = function () {
        for (let team in allTeamScore) {
            // 若 winTeam 是空的, 就設定第一個值為初始比較值
            if (checkObjectIsEmpty(winTeam)) {
                winTeam['teamName'] = team;
                winTeam['score'] = allTeamScore[team];
            }
            if (allTeamScore[team] === winTeam['score']) {
                winTeam['teamName'] = '平手, No one';
                winTeam['score'] = 0;
            }
            if (allTeamScore[team] > winTeam['score']) {
                winTeam['teamName'] = team;
                winTeam['score'] = allTeamScore[team];
            }
        }
        const winTeamName = winTeam['teamName'];
        judgeTeamWin(winTeamName);
    }

    operations.checkTeamHalfwayWin = function () {
        const allSnake = roleItemMediator.getData('getAllSnake');
        const halfwayWinTeam = halfwayFinishRuleChecker(allSnake); // 時間還沒到, 但中途獲勝的團隊

        if (halfwayWinTeam) {
            mainGameMediator.callAction('gameFinish');
            const winTeamName = halfwayWinTeam[0][0].snakeTeam;
            judgeTeamWin(winTeamName);
        }
    }

    //封在內部判定勝負的 function
    const judgeTeamWin = function (winTeamName) {
        noticeConfirm(`${winTeamName} is winner!`);
    };

    //處理呼叫參數的介面
    const callAction = function () {
        let action = Array.prototype.shift.call(arguments);
        operations[action].apply(this, arguments);
    }

    return {
        callAction: callAction
    };
})();

export {
    teamMediator
}
