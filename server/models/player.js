const WebSocket = require('ws')
const configs = require('../../game-configs.json')
const util = require('../util')

const defaultPlayerSnapshot = {
  movement: { left: false, right: false, up: false, down: false }
}

const syncTrigData = JSON.stringify({
  type: 'syncTrig'
})

module.exports = class Player {
  constructor(name, ws, id) {
    this.id = id
    this.name = name

    // TODO place this in playerState obj
    this.position = {
      x: util.randomIntFromInterval(0, configs.shared.mapWidth),
      y: util.randomIntFromInterval(0, configs.shared.mapHeight)
    }

    // an array of syncState where first entry is the one to be sent to client as syncState
    this.syncStates = [Object.assign({}, this.position), Object.assign({}, this.position)]

    this.isSyncing = true
    this.websocket = ws

    this.snapshotQueueUnproc = [] // snapshotQueue data from client to be process at each gameTick
    this.snapshotQueueProc = [] // snapshotQueue data that has been processed and ready to be send to all other clients

    // prefill player's snapshotQueue with default by bufferSize
    for (let i = 0; i < configs.shared.tickBufferSize * 2; i++) {
      this.snapshotQueueProc.push(defaultPlayerSnapshot)
    }
  }

  sendData(data) {
    if (this.websocket.readyState === WebSocket.OPEN)
      this.websocket.send(data)
  }

  // still needed?
  sendSyncTrig() {
    this.sendData(syncTrigData)
  }

  getBufferSnapshots() {
    return this.snapshotQueueProc.slice(0, configs.shared.tickBufferSize)
  }

  getIncrementalData() {
    return this.snapshotQueueProc.slice(configs.shared.tickBufferSize, configs.shared.tickBufferSize * 2)
  }

  insertUnprocSnapshots(snapshots) {
    this.snapshotQueueUnproc.push(...snapshots)
  }

  updatePlayerLocation(direction) {
    if (direction.left)
      this.position.x -= configs.shared.playerSpeed

    if (direction.right)
      this.position.x += configs.shared.playerSpeed

    if (direction.up)
      this.position.y -= configs.shared.playerSpeed

    if (direction.down)
      this.position.y += configs.shared.playerSpeed
  }

  playerMoveTick() {
    let playerSnapshot = this.snapshotQueueUnproc.shift()

    // player lagged and didn't send snapshot in time; give the default snapshot
    if (!playerSnapshot) {
      playerSnapshot = defaultPlayerSnapshot
    }

    this.updatePlayerLocation(playerSnapshot.movement)

    // insert postion data for player at tick to be broadcasted
    // TODO: include action in this once thats being implemented
    this.snapshotQueueProc.push(playerSnapshot)
    this.snapshotQueueProc.shift() // remove unneeded snapshot to prevent memory leak
  }

  processSyncStateTick() {
    this.syncStates.push(Object.assign({}, this.position))
  }

  sync(syncData) {
    this.sendData(syncData)
    this.isSyncing = false // syncing completed
  }

  //TODO: getPosition or getPlayerState
}
