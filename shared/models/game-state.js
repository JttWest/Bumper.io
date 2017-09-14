// const PlayerState = require('./player-state.js')
const configs = require('../../game-configs.json')
const Field = require('./field')
const util = require('../util')
const Coord = require('./coord')
const actions = require('../actions')

class Player {
  constructor(id, position) {
    this.id = id
    this.position = position
    this.snapshotQueue = []
    this.action = null // current excuting action
    this.isKilled = false // flag to mark player for clean up
  }

  /**
   * movement: {left: BOOLEAN, right: BOOLEAN, up: BOOLEAN, down: BOOLEAN}
   * action: STRING
   *
   * snapshot: {
   *  movement: {left: BOOLEAN, right: BOOLEAN, up: BOOLEAN, down: BOOLEAN},
   *  action: STRING
   * }
   */
  insertSnapshot(movement, action) {
    this.snapshotQueue.push({ movement, action })
  }

  /**
   *  movementData: { left: BOOLEAN, right: BOOLEAN, up: BOOLEAN, down: BOOLEAN }
   */
  movementTick(movement) {
    if (movement.left)
      this.position.x -= configs.shared.playerSpeed

    if (movement.right)
      this.position.x += configs.shared.playerSpeed

    if (movement.up)
      this.position.y -= configs.shared.playerSpeed

    if (movement.down)
      this.position.y += configs.shared.playerSpeed
  }

  /**
   *  actionData: string
   */
  actionTick(actionData, gameState) {
    // action in progress
    if (this.action) {
      if (this.action.readyToExcute()) {
        this.action.excuteResult(this, gameState) // pass in gameState since action can affect/modify the game state
        this.action = null
      } else {
        this.action.tick()
      }
    } else if (actionData) // no action in progress and user want to perform an action
      this.action = actions.create(actionData)
  }

  killed() {
    this.isKilled = true
  }
}

module.exports = class GameState {
  constructor() {
    // is this good enough?
    this.availablePlayerIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    this.players = {}

    const hZoneSize = configs.shared.mapWidth / configs.shared.zoneWidth
    const vZoneSize = configs.shared.mapHeight / configs.shared.zoneHeight

    if (!util.isInt(hZoneSize) || !util.isInt(vZoneSize)) {
      throw new Error('Invalid game config: The game currently require all zones to be same size with no left over region.')
    }

    this.field = new Field(hZoneSize, vZoneSize, configs.shared.zoneWidth, configs.shared.zoneHeight)
  }

  conquerZone(player) {
    this.field.conquerZone(1, player.position)
  }

  // process players movement and actions
  tick() {
    // process tick for each player in game
    Object.values(this.players).forEach((player) => {
      if (player.isKilled) { // remove killed players from game
        delete this.players[player.id]
      } else {
        const currSnapshot = player.snapshotQueue.shift()

        if (!currSnapshot)
          return

        player.movementTick(currSnapshot.movement)
        player.actionTick(currSnapshot.action, this)
      }
    })

    // TODO: zones logic tick
  }

  // pass in player obj
  join() {
    // TODO: implement unique ID logic
    const playerId = this.availablePlayerIds.shift()

    if (!playerId)
      throw new Error('Game is full as no player id is available!')

    const initPosition = new Coord(
      util.randomIntFromInterval(0, configs.shared.mapWidth),
      util.randomIntFromInterval(0, configs.shared.mapHeight)
    )

    const newPlayer = new Player(playerId, initPosition)

    this.players[playerId] = newPlayer

    return newPlayer
  }

  /* GameState Player Entry model
   id: {
    name: string,
    position: {x: number, y: number},
    snapshotQueue: [playerSnapshot]
  }
  */

  // TODO: uncomment these
  // addNewPlayer(joinData) {
  //   // TODO: maybe throw error if player already exists
  //   const playerId = joinData.playerId
  //   const name = joinData.name
  //   const position = joinData.position

  //   this.players[playerId] = new PlayerState(name)

  //   // happens when new player joins game you are already in
  //   if (position)
  //     this.players[playerId].position = position
  // }

  // updatePlayerPosition(playerId, position) {
  //   this.players[playerId].position = position
  // }

  // insertPlayerSnapshots(playerId, snapshots) {
  //   this.players[playerId].snapshotQueue.push(...snapshots)
  // }

  // /**
  //  * Returns an array of PlayerState
  //  */
  // get playerStates() {
  //   return Object.values(this.players)
  // }

  // getPlayerState(playerId) {
  //   if (!this.players[playerId])
  //     throw new Error(`Player with id ${playerId} doesn't exist in game state`)

  //   return this.players[playerId]
  // }
}
