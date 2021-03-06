const GameState = require('../../shared/models/game-state');
const configs = require('../../app-configs');
const WebSocket = require('ws');
const BotManager = require('./bot-manager');

class Player {
  constructor(id, roomId) {
    this.id = id;
    this.roomId = roomId;
    this.playerState = null;
    this.ws = null;
    this.numInactiveTicks = 0;
    this.syncing = true; // do not send regular game snapshots until syncing is set to false;
  }

  sendData(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN)
      this.ws.send(data);
  }
}

module.exports = class GameRoom {
  constructor(roomId) {
    this.availablePlayerIds = Array.from(Array(configs.server.gameRoom.maxPlayers).keys());
    this.roomId = roomId;
    this.players = new Map();
    this.gameState = new GameState();
    this.gameStateSnapshotQueue = Array(configs.shared.tickBufferSize).fill(this.gameState.getSnapshot());

    this.BotManager = new BotManager(this.gameState, configs.server.bot.numPerRoom);
  }

  hasAvailableSpot() {
    return this.availablePlayerIds.length > 0;
  }

  // TODO: move this to gameState and include bot's data
  // (will be to broadcast bot join data)
  getSessionData() {
    const sessionData = {};
    this.players.forEach((player) => {
      // only if player is in game
      if (player.playerState) {
        sessionData[player.id] = {
          name: player.playerState.name
        };
      }
    });

    return sessionData;
  }

  getSyncSnapshots() {
    return this.gameStateSnapshotQueue;
  }

  join() {
    // must have available spot
    const playerId = this.availablePlayerIds.shift();

    if (playerId === undefined)
      throw new Error(`Attempting to join full game room ${this.roomId}`);

    const player = new Player(playerId, this.roomId);
    this.players.set(player.id, player);

    return player;
  }

  tick() {
    this.BotManager.tick();
    const killedPlayerData = this.gameState.tick();

    killedPlayerData.forEach((data) => {
      const { id, points } = data;
      // there could be ids for bots in this array, which aren't part of gameroom players
      if (this.players.has(id))
        this.players.get(id).sendData(JSON.stringify(
          {
            type: 'killed',
            data: {
              points: points
            }
          }
        ));
    });

    this.gameStateSnapshotQueue.shift();
    this.gameStateSnapshotQueue.push(this.gameState.getSnapshot());
  }

  removePlayer(player) {
    this.availablePlayerIds.push(player.id);
    this.players.delete(player.id);

    if (player.ws)
      player.ws.close();

    // if player is still in game state
    const playerState = this.gameState.playerStates.get(player.id);
    if (playerState)
      this.gameState.removeFromGame(playerState);
  }

  broadcast(data) {
    this.players.forEach((player) => {
      player.sendData(data);
    });
  }
};
