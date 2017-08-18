const configs = require('../../game-configs.json')

const isDebugMode = () => window.isDebugMode || configs.client.isDebugMode

const lastTimeTracker = {
  playerPacketSend: null,
  gameStatePacketReceive: null,
  gameTick: null
}

const logTargetRate = (target, threshold = null) => {
  if (!isDebugMode)
    return

  if (!lastTimeTracker[target]) {
    lastTimeTracker[target] = performance.now()
  } else {
    const elapseTime = performance.now() - lastTimeTracker[target]
    if (threshold && elapseTime > threshold)
      console.log(`${target} took ${Math.round(elapseTime)}ms. Exceeded threshold of ${threshold}`)
    else if (!threshold)
      console.log(`${target} took ${Math.round(elapseTime)}ms`)

    lastTimeTracker[target] = performance.now()
  }
}

let emptySnapshotQueueStartTime

module.exports = {
  isDebugMode: isDebugMode,

  logPlayerPacketSendRate: (threshold) => {
    logTargetRate('playerPacketSend', threshold)
  },

  logGameStatePacketReceiveRate: (threshold) => {
    logTargetRate('gameStatePacketReceive', threshold)
  },

  logGameTickRate: (threshold) => {
    logTargetRate('gameTick', threshold)
  },

  logEmptySnapshotQueueDuration: (length) => {
    if (!isDebugMode)
      return

    if (length === 0 && !emptySnapshotQueueStartTime) { // start timer
      emptySnapshotQueueStartTime = performance.now()
    } else if (length !== 0 && emptySnapshotQueueStartTime) { // there was timer in process
      console.log(`GameState snapshot queue was empty for ${Math.round(performance.now() - emptySnapshotQueueStartTime)}ms`)
      emptySnapshotQueueStartTime = null // reset timer
    }
  }
}
