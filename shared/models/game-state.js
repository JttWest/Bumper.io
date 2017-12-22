const PlayerState = require('./player-state.js');
const configs = require('../../app-configs').shared;
const Field = require('./field');
const util = require('../util');
const Coord = require('./coord');
const physics = require('../physics');

module.exports = class GameState {
  constructor() {
    // this.availablePlayerIds = Array.from(Array(configs.maxPlayerLimit).keys());
    this.players = {};

    const numZonesH = configs.mapWidth / configs.zoneWidth;
    const numZonesV = configs.mapHeight / configs.zoneHeight;

    if (!util.isInt(numZonesH) || !util.isInt(numZonesV)) {
      throw new Error('Invalid game config: All zones must be same size and no left over region.');
    }

    this.field = new Field(numZonesH, numZonesV, configs.zoneWidth, configs.zoneHeight);
  }

  removeFromGame(player) {
    // award point to player that did the attack
    if (player.collision.collidedWith && this.players[player.collision.collidedWith])
      this.players[player.collision.collidedWith].points++;

    delete this.players[player.id];
    // this.availablePlayerIds.push(player.id);
    console.log(`Player ${player.id} killed`);
  }

  // process players movement and actions
  tick() {
    const players = Object.values(this.players);

    // process tick for each player in game
    players.forEach((player) => {
      if (player.isKilled) {
        this.removeFromGame(player);
      } else {
        const currInput = player.controlInputQueue.shift();

        // uppdate current player's state with control input data
        if (currInput && !player.overridePlayerControl)
          player.processControlInput(currInput);

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

    this.field.tick();

    // check which player are in kill zone
    players.forEach((player) => {
      if (
        player.position.x < 0 || player.position.x > configs.mapWidth || // out of bound horizontally
        player.position.y < 0 || player.position.y > configs.mapHeight || // out of bound vertically
        this.field.getZoneByCoord(player.position).isOn() // in a kill zone
      ) {
        player.isKilled = true;
      }
    }, this);
  }

  play(name, id) {
    if (this.players[id])
      throw new Error(`Duplicate player id in game state: ${id}`);

    let playerId = id; // this.availablePlayerIds.shift();

    // if (playerId === undefined) // TODO: undo this
    //   playerId = this.playerId++; // throw new Error('Game is full (no player id is available)');

    const initPosition = new Coord(
      util.randomIntFromInterval(0, configs.mapWidth),
      util.randomIntFromInterval(0, configs.mapHeight)
    );

    const playerState = new PlayerState(playerId, name, initPosition);

    this.players[playerId] = playerState;

    return playerState;
  }

  getPlayer(playerId) {
    if (!this.players[playerId]) {
      return null;
      // TODO: use debug module to log when this happens
      // throw new Error(`Player with id ${playerId} doesn't exist in game state`)
    }

    return this.players[playerId];
  }

  getSnapshot() {
    return {
      players: Object.values(this.players).map(player => player.getSnapshot()),
      field: {
        zones: this.field.zones.map(zone => ({
          coord: zone.coord,
          status: zone.status
        }))
      }
    };
  }
};
