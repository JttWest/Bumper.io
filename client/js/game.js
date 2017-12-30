const GameState = require('../../shared/models/game-state');
const graphics = require('./graphics');
const debug = require('../../shared/debug');
const configs = require('../../app-configs');

module.exports = class Game {
  // create on join
  constructor(ws, clientPlayerId) {
    this.ws = ws;
    this.clientPlayerId = clientPlayerId;
    this.syncing = true;

    this.serverGameSnapshotQueue = [];
  }

  sendControlInput(data) {
    const controlInputPayload = {
      type: 'controlInput',
      data: data
    };

    this.ws.send(JSON.stringify(controlInputPayload));
  }

  insertGameStateSnapshot(snapshot) {
    if (!this.syncing) {
      // clear old snapshot that are too out dated
      if (this.serverGameSnapshotQueue.length >= configs.shared.tickBufferSize) {
        this.serverGameSnapshotQueue.shift();
      }

      this.serverGameSnapshotQueue.push(snapshot);
    }
  }

  requestSync() {
    this.syncing = true;

    this.ws.send(JSON.stringify({ type: 'syncReq' }));
  }

  sync(syncData) {
    this.serverGameSnapshotQueue = [];
    this.serverGameSnapshotQueue.push(...syncData);

    this.syncing = false;
  }

  getCurrentSnapshot() {
    return this.serverGameSnapshotQueue[0];
  }

  render() {
    const currSnapshot = this.serverGameSnapshotQueue[0];

    if (currSnapshot)
      graphics.render(this.clientPlayerId, this.serverGameSnapshotQueue[0]);
  }

  tick() {
    // TODO: remove this
    $('#leaderboardContainer').text(this.serverGameSnapshotQueue.length);

    if (this.serverGameSnapshotQueue.length === 0) {
      this.requestSync();
    } else if (this.serverGameSnapshotQueue.length > configs.shared.tickBufferSize) {
      throw new Error(`serverGameSnapshotQueue exceeded size: ${this.serverGameSnapshotQueue.length}`);
    } else {
      debug.logEmptySnapshotQueueDuration(200);
      this.serverGameSnapshotQueue.shift();
    }
  }
};

/*
const serverGameSnapshotQueue = [];

// always render serverGameState to player (except current client player's position)

// render current client's positino based on clientGameState

// everything in here must be confirm by server
const clientInputQueue = [];

// on play
clientInputQueue.push(...Array(4).fill(null));

// server packet (snapshots)
// snapshot should be enough to recontruct the state
// gameState + the player's input at the gameState (could be null -> NO_INPUT)

const confirmInput = () => {

}

const getCurrentSnapshot

const tick = () => {
  // confirm player input


  // serverGameState.tick() -> render rest of gameState from here

  // clientGameState.tick() -> render current player from here

}
*/
