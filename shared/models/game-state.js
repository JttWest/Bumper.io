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

  removeFromGame(pState) {
    delete this.players[pState.id];
    console.log(`Player ${pState.id} killed`);
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
        if (!player.overridePlayerControl)
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
      if (player.actions.dash && player.status.unmaterialized === 0) {
        players.forEach((otherPlayer) => {
          // only resolve collision when player is dashing
          if (player.id !== otherPlayer.id && physics.checkCollision(player, otherPlayer) && otherPlayer.status.unmaterialized === 0) {
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

    // check which player should be killed
    players.forEach((player) => {
      if (
        player.position.x <= 0 || player.position.x >= configs.mapWidth || // out of bound horizontally
        player.position.y <= 0 || player.position.y >= configs.mapHeight || // out of bound vertically
        this.field.getZoneByCoord(player.position).isOn() // in a kill zone
      ) {
        // only kill player if materialized
        if (player.status.unmaterialized === 0) {
          // award point to collidee player (if there is 1) before removing current player
          if (player.collision.collidedWith !== null && this.players[player.collision.collidedWith])
            this.players[player.collision.collidedWith].points++;

          player.kill();
        }
      }
    }, this);
  }

  play(name, id) {
    // allow new player to overwrite old one
    // if (this.players[id])
    //   throw new Error(`Duplicate player id in game state: ${id}`);

    let playerId = id; // this.availablePlayerIds.shift();

    const initPosition = new Coord(
      util.randomIntFromInterval(0, configs.mapWidth),
      util.randomIntFromInterval(0, configs.mapHeight)
    );

    const playerState = new PlayerState(playerId, name, initPosition);

    this.players[playerId] = playerState;

    return playerState;
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
