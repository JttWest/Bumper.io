const GameState = require('../../shared/models/game-state');
const configs = require('../../app-configs');
const WebSocket = require('ws');

class Player {
  constructor(id, roomId) {
    this.id = id;
    this.roomId = roomId;
    this.playerState = null;
    this.ws = null;
    this.numInactiveTicks = 0;
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
  }

  hasAvailableSpot() {
    return this.availablePlayerIds.length > 0;
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
    this.gameState.tick();
  }

  // if player is inactive for too long
  removePlayer(player) {
    this.availablePlayerIds.push(player.id);
    this.players.delete(player.id);
  }

  broadcast(data) {
    this.players.forEach((player) => {
      player.sendData(data);
    });
  }
};
