const Player = require('./player.js');
const configs = require('../../game-configs.json').shared;
const Field = require('./field');
const util = require('../util');
const Coord = require('./coord');
const physics = require('../physics');

module.exports = class GameState {
  constructor() {
    this.availablePlayerIds = Array.from(Array(configs.maxPlayerLimit).keys());
    this.players = {};

    const hZoneSize = configs.mapWidth / configs.zoneWidth;
    const vZoneSize = configs.mapHeight / configs.zoneHeight;

    if (!util.isInt(hZoneSize) || !util.isInt(vZoneSize)) {
      throw new Error('Invalid game config: The game currently require all zones to be same size with no left over region.');
    }

    this.field = new Field(hZoneSize, vZoneSize, configs.zoneWidth, configs.zoneHeight);
  }

  conquerZone(player) {
    this.field.conquerZone(1, player.position);
  }

  removeFromGame(player) {
    // award point to player that did the attack
    if (player.collision.collidedWith && this.players[player.collision.collidedWith])
      this.players[player.collision.collidedWith].points++;

    delete this.players[player.id];
    this.availablePlayerIds.push(player.id);
    console.log(`Player ${player.id} killed`);

    // TODO: put players into standby queue so they can rejoin game?
  }

  // process players movement and actions
  tick() {
    const players = Object.values(this.players);

    // process tick for each player in game
    players.forEach((player) => {
      if (player.isKilled) { // remove killed players from game
        this.removeFromGame(player);
      } else {
        const currSnapshot = player.snapshotQueue.shift();

        // uppdate current player's state with snapshot data
        if (currSnapshot && !player.overridePlayerControl)
          player.processSnapshot(currSnapshot);

        player.tick();
      }
    });

    // collision
    players.forEach((player) => {
      if (player.collision.duration > 0) {
        player.collision.duration--;
      } else {
        player.collision.collidedWith = null;
      }

      // resolve any collision when player is dashing
      if (player.actions.dash) {
        players.forEach((otherPlayer) => {
          // only resolve collision when player is dashing
          if (player.id !== otherPlayer.id && physics.checkCollision(player, otherPlayer)) {
            console.log(`${player.name}(${player.id}) collided with ${otherPlayer.name}(${otherPlayer.id})`);

            if (player.overridePlayerControl < configs.collisionDisplacementDuration)
              player.overridePlayerControl = configs.collisionDisplacementDuration;

            if (otherPlayer.overridePlayerControl < configs.collisionDisplacementDuration)
              otherPlayer.overridePlayerControl = configs.collisionDisplacementDuration;

            // track collision to allocate credit if there's a kill
            player.collision.collidedWith = otherPlayer.id;
            player.collision.duration = configs.collisionDisplacementDuration;

            otherPlayer.collision.collidedWith = player.id;
            otherPlayer.collision.duration = configs.collisionDisplacementDuration;

            physics.resolveCollision(player, otherPlayer);
          }
        });
      }
    });

    // check which player are in kill zone
    players.forEach((player) => {
      // out of bound
      if (player.position.x < 0 || player.position.x > configs.mapWidth ||
        player.position.y < 0 || player.position.y > configs.mapHeight)
        player.isKilled = true;
    });
  }

  play(name) {
    const playerId = this.availablePlayerIds.shift();

    if (playerId === undefined)
      throw new Error('Game is full (no player id is available)');

    const initPosition = new Coord(
      util.randomIntFromInterval(0, configs.mapWidth),
      util.randomIntFromInterval(0, configs.mapHeight)
    );

    const newPlayer = new Player(playerId, name, initPosition);

    this.players[playerId] = newPlayer;

    return newPlayer;
  }

  getPlayer(playerId) {
    if (!this.players[playerId]) {
      return null;
      // TODO: use debug module to log when this happens
      // throw new Error(`Player with id ${playerId} doesn't exist in game state`)
    }

    return this.players[playerId];
  }
};
