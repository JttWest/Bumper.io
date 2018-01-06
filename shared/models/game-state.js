const PlayerState = require('./player-state.js');
const configs = require('../../app-configs').shared;
const Field = require('./field');
const util = require('../util');
const Coord = require('./coord');
const physics = require('../physics');

module.exports = class GameState {
  constructor() {
    // this.availablePlayerIds = Array.from(Array(configs.maxPlayerLimit).keys());
    this.playerStates = new Map();

    const numZonesH = configs.mapWidth / configs.zoneWidth;
    const numZonesV = configs.mapHeight / configs.zoneHeight;

    if (!util.isInt(numZonesH) || !util.isInt(numZonesV)) {
      throw new Error('Invalid game config: All zones must be same size and no left over region.');
    }

    this.field = new Field(numZonesH, numZonesV, configs.zoneWidth, configs.zoneHeight);
  }

  removeFromGame(pState) {
    this.playerStates.delete(pState.id);
  }

  // process players movement and actions
  tick() {
    // {id, points}
    const killedPlayerData = [];

    // process tick for each player in game
    this.playerStates.forEach((state) => {
      if (state.isKilled) {
        killedPlayerData.push({ id: state.id, points: state.points });
        this.removeFromGame(state);
      } else {
        const currInput = state.controlInputQueue.shift();

        // uppdate current player's state with control input data
        if (!state.overridePlayerControl)
          state.processControlInput(currInput);

        state.tick();
      }
    });

    // collision
    this.playerStates.forEach((state) => {
      if (state.collision.duration > 0) {
        state.collision.duration--;
      } else {
        state.collision.collidedWith = null;
      }

      // resolve any collision when player is dashing
      if (state.actions.dash && state.status.unmaterialized === 0) {
        this.playerStates.forEach((otherPlayerState) => {
          // only resolve collision when player is dashing
          if (state.id !== otherPlayerState.id && physics.checkCollision(state, otherPlayerState) && otherPlayerState.status.unmaterialized === 0) {
            if (state.overridePlayerControl < configs.collisionDisplacementDuration)
              state.overridePlayerControl = configs.collisionDisplacementDuration;

            if (otherPlayerState.overridePlayerControl < configs.collisionDisplacementDuration)
              otherPlayerState.overridePlayerControl = configs.collisionDisplacementDuration;

            // track collision to allocate credit if there's a kill
            state.collision.collidedWith = otherPlayerState.id;
            state.collision.duration = configs.collisionDisplacementDuration;

            otherPlayerState.collision.collidedWith = state.id;
            otherPlayerState.collision.duration = configs.collisionDisplacementDuration;

            physics.resolveCollision(state, otherPlayerState);
          }
        });
      }
    });

    this.field.tick();

    // check which player should be killed
    this.playerStates.forEach((state) => {
      if (
        state.position.x <= 0 || state.position.x >= configs.mapWidth || // out of bound horizontally
        state.position.y <= 0 || state.position.y >= configs.mapHeight || // out of bound vertically
        this.field.getZoneByCoord(state.position).isOn() // in a kill zone
      ) {
        // only kill player if materialized
        if (state.status.unmaterialized === 0) {
          // award point to collidee player (if there is 1) before removing current player
          const attackingPlayer = this.playerStates.get(state.collision.collidedWith);

          if (attackingPlayer)
            attackingPlayer.points++;

          state.kill();
        }
      }
    }, this);

    return killedPlayerData; // for notifying dead players
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

    this.playerStates.set(playerId, playerState);

    return playerState;
  }

  getSnapshot() {
    const playerSnapshots = [];

    this.playerStates.forEach((playerState) => {
      playerSnapshots.push(playerState.getSnapshot());
    });

    return {
      players: playerSnapshots,
      field: {
        zones: this.field.zones.map(zone => ({
          coord: zone.coord,
          status: zone.status
        }))
      }
    };
  }
};
