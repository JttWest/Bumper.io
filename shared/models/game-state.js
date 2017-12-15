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

    // for each player in game -> apply movement + set action
    // for each player in game -> check whether they have collided with another player
    //    if collided -> set resolve movement direction
    players.forEach((player) => {
      players.forEach((otherPlayer) => {
        // only resolve collision when player is dashing
        if (player.id !== otherPlayer.id && player.actions.dash && physics.checkCollision(player, otherPlayer)) {
          console.log(`${player.id} collided with ${otherPlayer.id}`);

          // player was already collision; refresh duration
          if (player.overridePlayerControl < configs.collisionOverrideDuration)
            player.overridePlayerControl = configs.collisionOverrideDuration;

          // other player was already collision; refresh duration
          if (otherPlayer.overridePlayerControl < configs.collisionOverrideDuration)
            otherPlayer.overridePlayerControl = configs.collisionOverrideDuration;

          physics.resolveCollision(player, otherPlayer);
        }
      });
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
