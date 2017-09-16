const configs = require('../../game-configs')
const util = require('./../util')

const minBotMovementRepeat = 5
const maxBotMovementRepeast = 50

class BotPlayer {
  constructor(player) {
    this.player = player
    this.movement = {
      direction: { left: false, right: false, up: false, down: false },
      movementRepeatCount: 0
    }
  }

  isKilled() {
    return this.player.isKilled
  }

  tick() {
    if (this.movement.movementRepeatCount <= 0) {
      this.movement.movementRepeatCount = util.randomIntFromInterval(minBotMovementRepeat, maxBotMovementRepeast)

      this.movement.direction = util.randomFloatFromInterval(-Math.PI, Math.PI)
    }

    // move bot
    this.player.insertSnapshot(this.movement.direction)
    this.movement.movementRepeatCount--
  }
}

module.exports = class BotManager {
  constructor(gameState) {
    this.gameState = gameState
    this.bots = {}
  }

  createBots(numBots) {
    for (let i = 0; i < numBots; ++i) {
      const player = this.gameState.join()
      this.bots[player.id] = new BotPlayer(player)
    }
  }

  tick() {
    Object.values(this.bots).forEach((bot) => {
      if (bot.isKilled())
        delete this.bots[bot.player.id]
      else
        bot.tick()
    })
  }
}
