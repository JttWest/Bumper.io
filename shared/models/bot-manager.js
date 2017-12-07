const util = require('./../util')

/**
 * BotPlayer have intention : {
 *  type: string
 *  data: ??
 * }
 *
 * on each BotPlayer tick:
 * generateDecisionSnapshot(intention): snapshot
 *
 * updateIntention -> looks at gameState data and recaclulate intention
 *
 */

const minBotMovementRepeat = 5
const maxBotMovementRepeast = 50

class Intention {
  constructor(type, data) {
    this.type = type
    this.data = data
  }
}

// should be a util function
const getAngleBetweenCoords = (originCoord, targetCoord) => {
  const deltaX = targetCoord.x - originCoord.x
  const deltaY = targetCoord.y - originCoord.y

  return Math.atan2(deltaY, deltaX)
}

const getTargetDistance = (playerCoord, targetCoord) => {
  const dx = playerCoord.x - targetCoord.x
  const dy = playerCoord.y - targetCoord.y

  return Math.sqrt((dx * dx) + (dy * dy))
}

const generateDashTowardTargetSnapshot = (player, target) => {
  const movement = getAngleBetweenCoords(player.position, target.position)
  const action = 'dash'

  return { movement, action }
}

const generateMoveTowardTargetSnapshot = (player, target) => {
  const movement = getAngleBetweenCoords(player.position, target.position)
  return { movement }
}

const getClosestPlayer = (player, gameState) => {
  let closestPlayer
  let distance = Number.POSITIVE_INFINITY

  Object.values(gameState.players).forEach((p) => {
    // skip current player during check
    if (player.id === p.id)
      return

    const currDist = getTargetDistance(player.position, p.position)
    if (currDist < distance)
      closestPlayer = p
  })

  return closestPlayer
}

const dashClosest = (player, gameState) => {
  // look at gameState players and check how far away they are
  // pick first player in range for now
  const closestPlayer = getClosestPlayer(player, gameState)

  const snapshot = generateDashTowardTargetSnapshot(player, closestPlayer)
  player.insertSnapshot(snapshot.movement, snapshot.action)
}

class BotPlayer {
  constructor(player, gameState) {
    this.player = player
    this.movement = {
      direction: null,
      movementRepeatCount: 0
    }

    this.gameState = gameState
    this.intention = null
  }

  isKilled() {
    return this.player.isKilled
  }

  tick() {
    const chance = Math.random()

    if (chance < 0.01) {
      this.player.insertSnapshot(null, 'attack')
    } else if (chance < 0.5 && this.player.actions.attack) {
      // only dash when attacking
      dashClosest(this.player, this.gameState)
    } else {
      if (this.movement.movementRepeatCount <= 0) {
        this.movement.movementRepeatCount = util.randomIntFromInterval(minBotMovementRepeat, maxBotMovementRepeast)

        this.movement.direction = util.randomFloatFromInterval(-Math.PI, Math.PI)
      }

      // move bot
      this.player.insertSnapshot(this.movement.direction)
      this.movement.movementRepeatCount--
    }
  }

  updateIntention() {
    // player currently have no intention
    if (!this.intention) {
      this.intention = new Intention('attack', { target: util.randomIntFromInterval(2, 5) })
    }
  }

  generateDecisionSnapshot() {
    const intention = this.intention
    let decisionSnapshot

    switch (intention.type) {
      case 'attack': {
        const targetPlayer = this.gameState.getPlayer(intention.data.target)

        // target is no longer in game
        if (!targetPlayer) {
          // TODO: create new decision
          return
        }

        const deltaX = targetPlayer.position.x - this.player.position.x
        const deltaY = targetPlayer.position.y - this.player.position.y

        // move toward data.target
        const direction = Math.atan2(deltaY, deltaX)

        decisionSnapshot = { movement: direction, action: 'dash' }
        break
      }
      case 'wander':
        break
      default:
        throw new Error(`Invalid intention type: ${intention.type}`)
    }

    return decisionSnapshot
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
      this.bots[player.id] = new BotPlayer(player, this.gameState)
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
