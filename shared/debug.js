const configs = require('../app-configs');

const isDebugMode = () => {
  if (typeof window !== 'undefined') { // browser
    return window.isDebugMode === true;
  }

  // node.js
  return configs.server.debug.active === true;
};

const lastTimeTracker = {
  playerPacketSend: null,
  gameStatePacketReceive: null,
  gameTick: null,
  serverTick: null
};

const getCurrentTime = () => {
  if (typeof performance !== 'undefined')
    return performance.now();

  return Date.now();
};

const logTargetRate = (target, threshold = null) => {
  if (!isDebugMode())
    return;

  if (!lastTimeTracker[target]) {
    lastTimeTracker[target] = getCurrentTime();
  } else {
    const elapseTime = getCurrentTime() - lastTimeTracker[target];
    if (threshold && elapseTime > threshold)
      console.log(`${target} took ${Math.round(elapseTime)}ms. Exceeded threshold of ${threshold}`);
    else if (!threshold)
      console.log(`${target} took ${Math.round(elapseTime)}ms`);

    lastTimeTracker[target] = getCurrentTime();
  }
};

let emptySnapshotQueueStartTime;

module.exports = {
  isDebugMode: isDebugMode,

  logPlayerPacketSendRate: (threshold) => {
    logTargetRate('playerPacketSend', threshold);
  },

  logGameStatePacketReceiveRate: (threshold) => {
    logTargetRate('gameStatePacketReceive', threshold);
  },

  logGameTickRate: (threshold) => {
    logTargetRate('gameTick', threshold);
  },

  logServerTickRate: (threshold) => {
    logTargetRate('serverTick', threshold);
  },

  logEmptySnapshotQueueDuration: (length) => {
    if (!isDebugMode())
      return;

    if (length === 0 && !emptySnapshotQueueStartTime) { // start timer
      emptySnapshotQueueStartTime = getCurrentTime();
    } else if (length !== 0 && emptySnapshotQueueStartTime) { // there was timer in process
      console.log(`GameState snapshot queue was empty for ${Math.round(getCurrentTime() - emptySnapshotQueueStartTime)}ms`);
      emptySnapshotQueueStartTime = null; // reset timer
    }
  }
};
