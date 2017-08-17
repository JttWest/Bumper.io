const PlayerState = require('./player-state.js')

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

  addNewPlayer(joinData) {
    // TODO: maybe throw error if player already exists
    const playerId = joinData.playerId
    const name = joinData.name
    const position = joinData.position

    this.players[playerId] = new PlayerState(name)

    // happens when new player joins game you are already in
    if (position)
      this.players[playerId].position = position
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
