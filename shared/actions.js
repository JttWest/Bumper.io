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
    if (this.countdown > 0)
      throw new Error('Cannot excute action result before countdown reaches 0.')

    Object.values(gameState.players).forEach((p) => {
      // ignore on player that performed the action
      if (p.id !== player.id) {
        const dx = player.position.x - p.position.x
        const dy = player.position.y - p.position.y

        if (Math.sqrt((dx * dx) + (dy * dy)) < 2 * configs.shared.playerRadius)
          p.killed()
      }
    })
  }
}

class ConquerAction extends Action {
  constructor() {
    super('conquer', 0)
  }

  excuteResult(player, gameState) {
    if (this.countdown > 0)
      throw new Error('Cannot excute action result before countdown reaches 0.')

    gameState.field.conquerZone(player.id, player.position)
  }
}

const actionTypeMapper = {
  attack: AttackAction,
  conquer: ConquerAction
}

module.exports = {
  // Action factory
  create: (type) => {
    const ActionConstructor = actionTypeMapper[type]

    if (!ActionConstructor)
      throw new Error(`Inavlid action type: ${type}`)

    return new ActionConstructor()
  }
}
