const configs = require('../../game-configs.json');
const MultiTickEvent = require('./multi-tick-event');

class PlayerAction extends MultiTickEvent {
  constructor(type, countdown, duration, cooldown) {
    super(countdown, duration, cooldown);
    this.type = type;
  }
}


// class AttackAction extends Action {
//   constructor() {
//     super('attack', configs.shared.attackCountdown, 0, 0);
//   }

//   executeResult(player, gameState) {
//     if (this.countdown > 0)
//       throw new Error('Cannot excute action result before countdown reaches 0.');

//     super.excuteResult();

//     Object.values(gameState.players).forEach((p) => {
//       // ignore on player that performed the action
//       if (p.id !== player.id) {
//         const dx = player.position.x - p.position.x;
//         const dy = player.position.y - p.position.y;

//         if (Math.sqrt((dx * dx) + (dy * dy)) < 2 * configs.shared.playerRadius)
//           p.killed();
//       }
//     });
//   }
// }

// class ConquerAction extends Action {
//   constructor() {
//     super('conquer', 0, 0, 50);
//   }

//   executeResult(player, gameState) {
//     if (this.countdown > 0)
//       throw new Error('Cannot excute action result before countdown reaches 0.');

//     super.excuteResult();

//     gameState.field.conquerZone(player.id, player.position);
//   }
// }


class DashAction extends PlayerAction {
  constructor() {
    super('dash', 0, 10, 20);
  }

  executeResult(player) {
    if (this.countdown > 0)
      throw new Error('Cannot excute action result before countdown reaches 0.');

    super.excuteResult();
    player.overridePlayerControl = this.duration;
    player.speed = configs.shared.playerDashSpeed;

    const angle = Math.atan2(player.velocity.y, player.velocity.x);
    player.velocity.x = player.speed * Math.cos(angle);
    player.velocity.y = player.speed * Math.sin(angle);

    this.player = player;
  }

  tick() {
    super.tick();

    if (this.isCompleted()) {
      this.player.speed = configs.shared.playerSpeed;
    }
  }
}

const actionTypeMapper = {
  // attack: AttackAction,
  // conquer: ConquerAction,
  dash: DashAction
};

module.exports = {
  factory: (actionType) => {
    const ActionConstructor = actionTypeMapper[actionType];

    if (!ActionConstructor)
      throw new Error(`Inavlid action type: ${actionType}`);

    return new ActionConstructor();
  }
};
