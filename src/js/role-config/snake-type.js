/** Strategy Pattern **/

/** Snake Team **/
// 0 = A Team (藍色)
// 1 = B Team (紅色)

import {getRandomPosition} from '../common/util.js';
import {aSnakeOperation, bSnakeOperation} from './snake-operation.js';

const snakeTypeInfo = {
    0: function () {
        return {
            snakeSpeed: 1,
            snakeTeam: 'a-team',
            playerId: 'a-snake',
            initBodyPosition: [getRandomPosition()],
            direction: {x: 0, y: 0},
            operation: aSnakeOperation,
            snakeStyleName: 'a-snake-body'
        }
    },
    1: function () {
       return {
           snakeSpeed: 1,
           snakeTeam: 'b-team',
           playerId: 'b-snake',
           initBodyPosition: [getRandomPosition()],
           direction: {x: 0, y: 0},
           operation: bSnakeOperation,
           snakeStyleName: 'b-snake-body'
       }
    }
}

export {
    snakeTypeInfo
}
