const graphics = require('./graphics');
const debug = require('../../shared/debug');
const configs = require('../../app-configs');
const Coord = require('../../shared/models/coord');

const validatePrediction = (serverSnapshot, predictionSnapshot) => {
  if (Math.round(serverSnapshot.position.x) === Math.round(predictionSnapshot.position.x) &&
    Math.round(serverSnapshot.position.y) === Math.round(predictionSnapshot.position.y))
    return true;

  return false;
};

const getLatestClientSnapshot = (clientPlayerId, snapshotQueue) => {
  if (snapshotQueue.length === 0)
    return null;

  const latestGameSnapshot = snapshotQueue[snapshotQueue.length - 1];

  const clientPlayer = latestGameSnapshot.players
    .find(player => player.id === clientPlayerId);

  return clientPlayer;
};

const computeNewPosition = (oldPosition, angle, speed) => {
  const dx = speed * Math.cos(angle);
  const dy = speed * Math.sin(angle);

  return new Coord(oldPosition.x + dx, oldPosition.y + dy);
};

module.exports = class Game {
  // create on join
  constructor(ws, clientPlayerId) {
    this.ws = ws;
    this.clientPlayerId = clientPlayerId;
    this.clientPrediction = { position: null };

    this.syncing = true;

    // names of players in game
    this.sessionData = null;

    this.serverGameSnapshotQueue = [];

    // client side prediction
    this.predictionSnapshotQueue = [];
  }

  getCurrentPlayers() {
    const currSnapshot = this.serverGameSnapshotQueue[0];

    if (currSnapshot)
      return currSnapshot.players;

    return null;
  }

  getCurrentClientSnapshot() {
    const currSnapshot = this.serverGameSnapshotQueue[0];

    if (currSnapshot) {
      const clientPlayer = currSnapshot.players
        .find(player => player.id === this.clientPlayerId && !player.isKilled);

      return clientPlayer;
    }

    return null;
  }

  sendControlInput(data) {
    const controlInputPayload = {
      type: 'controlInput',
      data: data
    };

    this.ws.send(JSON.stringify(controlInputPayload));

    // TODO: get new position based on input data
    let oldPosition = this.clientPrediction.position;

    const newPosition = computeNewPosition(oldPosition, data.movement, configs.shared.playerSpeed);
    this.clientPrediction.position = newPosition;

    // TODO: fix status and others fields
    const predictionSnapshot = { position: newPosition, status: {} };

    this.predictionSnapshotQueue.push(predictionSnapshot);
  }

  insertGameStateSnapshot(snapshot) {
    if (!this.syncing) {
      // clear old snapshot that are too out dated
      if (this.serverGameSnapshotQueue.length >= configs.shared.tickBufferSize) {
        this.serverGameSnapshotQueue.shift();
      }

      this.serverGameSnapshotQueue.push(snapshot);

      // confirm client's prediction
      const clientPlayerSnapshot = snapshot.players.find(player => player.id === this.clientPlayerId);

      // only try to validate prediction if client input was processed
      if (clientPlayerSnapshot && !clientPlayerSnapshot.noInput) {
        // get oldest unvalidated prediction snapshot
        const predictionSnapshot = this.predictionSnapshotQueue.shift();

        // prediction doesn't match server
        if (predictionSnapshot && !validatePrediction(clientPlayerSnapshot, predictionSnapshot)) {
          console.log('wrong prediction');
          this.predictionSnapshotQueue = [];
        }
      }
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

  setSessionData(sessionData) {
    this.sessionData = sessionData;
  }

  updateSessionData(id, data) {
    this.sessionData[id] = data;
  }

  render() {
    const currSnapshot = this.serverGameSnapshotQueue[0];

    if (currSnapshot) {
      const clientPlayerSnapshot = this.predictionSnapshotQueue.length > 0 ?
        this.predictionSnapshotQueue[0] :
        this.getCurrentClientSnapshot();

      graphics.render(this.clientPlayerId, clientPlayerSnapshot, currSnapshot, this.sessionData);
    }
  }

  tick() {
    if (debug.isDebugMode()) {
      $('#snapshotsInQueue').text(`Snapshots in GameState Queue: ${this.serverGameSnapshotQueue.length}`);
      $('#predictionsInQueue').text(`Snapshots in Prediction Queue: ${this.predictionSnapshotQueue.length}`);
    }

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
