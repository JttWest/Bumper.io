const configs = require('../game-configs.json');

class Action {
  constructor(type, countdown, duration, cooldown) {
    this.type = type;
    this.executed = false;
    this.countdown = countdown; // how long before action is executed
    this.duration = duration; // how long will action remain after its executed
    this.cooldown = cooldown; // how long before user can perform same action again
  }

  tick() {
    if (this.countdown > 0)
      this.countdown--;
    else if (this.duration > 0)
      this.duration--;
    else if (this.cooldown > 0)
      this.cooldown--;
  }

  isReadyToExecute() {
    return !this.executed && this.countdown <= 0; // has not yet been excuted and is ready to do so
  }

  excuteResult() {
    this.executed = true;
  }

  isCompleted() {
    return this.executed && this.duration <= 0; // has been excuted and no duration left
  }

  isCooldownOver() {
    return this.executed && this.cooldown <= 0;
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


// Dash player a short distance toward mouse pointer
// player lose movement control during this time
class DashAction extends Action {
  constructor() {
    super('dash', 0, 10, 20);

    // const dx = 5 * configs.shared.playerSpeed * Math.cos(directionAngle);
    // const dy = 5 * configs.shared.playerSpeed * Math.sin(directionAngle);

    // this.dashMovement = { dx, dy };
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

    // // dash player while action is being executed but yet to finish its duration
    // if (this.executed && !this.isCompleted()) {
    //   this.player.overridePlayerControl = 10; // TODO: temp fix

    // } else if (this.isCompleted()) {
    //   this.player.speed = configs.shared.playerSpeed;
    // }

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
  /**
   * snapshot: {
   *  action: STRING
   *  movement: {left, right, up, down}
   * }
   */
  factory: (snapshot) => {
    const ActionConstructor = actionTypeMapper[snapshot.action];

    if (!ActionConstructor)
      throw new Error(`Inavlid action type: ${snapshot.action}`);

    if (snapshot.action === 'dash')
      return new ActionConstructor(snapshot.movement);

    return new ActionConstructor();
  }
};
