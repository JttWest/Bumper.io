const configs = require('../../game-configs.json')

const lastTimeTracker = {
  playerPacketSend: null,
  gameStatePacketReceive: null,
  gameTick: null
}

const logTargetRate = (target, threshold = null) => {
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

module.exports = {
  isDebugMode: () => window.isDebugMode || configs.client.isDebugMode,

  logPlayerPacketSendRate: (threshold) => {
    logTargetRate('playerPacketSend', threshold)
  },

  logGameStatePacketReceiveRate: (threshold) => {
    logTargetRate('gameStatePacketReceive', threshold)
  },

  logGameTickRate: (threshold) => {
    logTargetRate('gameTick', threshold)
  }
}
