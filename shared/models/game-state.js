// const PlayerState = require('./player-state.js')
const configs = require('../../game-configs.json')
const Field = require('./field')
const util = require('../util')

module.exports = class GameState {
  constructor() {
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
