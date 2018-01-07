const configs = require('../../app-configs');
const MultiTickEvent = require('./multi-tick-event');

class PlayerAction extends MultiTickEvent {
  constructor(type, countdown, duration, cooldown) {
    super(countdown, duration, cooldown);
    this.type = type;
  }
}

class DashAction extends PlayerAction {
  constructor() {
    super('dash', 0, 10, 20);
  }

  executeEvent(player) {
    if (this.countdown > 0)
      throw new Error('Cannot excute action result before countdown reaches 0.');

    super.executeEvent();
    player.overridePlayerControl = this.duration;
    player.status.hitting = this.duration;

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
