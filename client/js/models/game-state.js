// const Coord = require('./coord.js')

module.exports = class GameState {
  constructor() {
    this.players = {}
  }

  /* GameState Entry model
   id: {
    name: string,
    position: {x: number, y: number},
    snapshotQueue: [playerSnapshot]
  }
  */

  addNewPlayer(playerId, name) {
    // TODO: maybe throw error if player already exists
    this.players[playerId] = {
      name: name,
      position: null,
      snapshotQueue: []
    }
  }

  updatePlayerPosition(playerId, position) {
    this.players[playerId].position = position
  }

  insertPlayerSnapshots(playerId, snapshots) {
    this.players[playerId].snapshotQueue.push(...snapshots)
  }

  /**
   * Returns an array of PlayerState
   */
  get playerStates() {
    return Object.values(this.players)
  }

  getPlayerState(playerId) {
    if (!this.players[playerId])
      throw new Error(`Player with id ${playerId} doesn't exist in game state`)

    return this.players[playerId]
  }
}
