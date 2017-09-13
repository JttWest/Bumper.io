const configs = require('../game-configs.json')

class Action {
  constructor(type, countdown) {
    this.type = type
    this.countdown = countdown
  }

  tick() {
    this.countdown--
  }

  readyToExcute() {
    return this.countdown <= 0
  }
}


class AttackAction extends Action {
  constructor() {
    super('attack', configs.shared.attackCountdown)
  }

  excuteResult(player, gameState) {
    // for each player that is not current player
    //   check those in range:
    //     mark those as killed
  }
}

// Action factory

module.exports = {
  create: (type) => {
    return new AttackAction()
  }
}
