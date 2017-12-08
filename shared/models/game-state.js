// const PlayerState = require('./player-state.js')
const configs = require('../../game-configs.json');
const Field = require('./field');
const util = require('../util');
const Coord = require('./coord');
const actionFactory = require('../actions').factory;

class Player {
  constructor(id, position) {
    this.id = id;
    this.position = position;
    this.snapshotQueue = [];
    this.actions = {}; // current actions in progress
    this.overrideMovement = false; // player movement is not processed when set
    this.isKilled = false; // flag to mark player for clean up
  }

  move(dx, dy) {
    if (util.isNegativeNumber(dx) && this.position.x + dx < 0) // moving left out of map
      this.position.x = 0;
    else if (!util.isNegativeNumber(dx) && this.position.x + dx > configs.shared.mapWidth) // moving right out of map
      this.position.x = configs.shared.mapWidth;
    else
      this.position.x += dx;

    if (util.isNegativeNumber(dy) && this.position.y + dy < 0) // moving up out of map
      this.position.y = 0;
    else if (!util.isNegativeNumber(dy) && this.position.y + dy > configs.shared.mapHeight) // moving down out of map
      this.position.y = configs.shared.mapHeight;
    else
      this.position.y += dy;
  }

  /**
   * movement: {left: BOOLEAN, right: BOOLEAN, up: BOOLEAN, down: BOOLEAN}
   * action: STRING
   *
   * snapshot: {
   *  movement: {left: BOOLEAN, right: BOOLEAN, up: BOOLEAN, down: BOOLEAN},
   *  action: STRING
   * }
   */
  insertSnapshot(movement, action) {
    this.snapshotQueue.push({ movement, action });
  }

  /**
   *  movementData: { left: BOOLEAN, right: BOOLEAN, up: BOOLEAN, down: BOOLEAN }
   */
  movementTick(angle) {
    // movement has been override by action or doesn't have movment angle
    if (this.overrideMovement || !angle)
      return;

    const dx = configs.shared.playerSpeed * Math.cos(angle);
    const dy = configs.shared.playerSpeed * Math.sin(angle);
    this.move(dx, dy);
  }

  /**
   *  actionData: string
   */
  actionTick(snapshot, gameState) {
    // create the requested new action if it's not already in progress
    if (snapshot.action && !this.actions[snapshot.action]) {
      this.actions[snapshot.action] = actionFactory(snapshot);
    }

    Object.keys(this.actions).forEach((actionName) => {
      const action = this.actions[actionName];

      if (action.isReadyToExecute())
        action.executeResult(this, gameState); // pass in gameState since action can affect/modify the game state
      else if (action.isCompleted() && action.isCooldownOver())
        delete this.actions[actionName];
      else
        action.tick();
    });
  }

  killed() {
    this.isKilled = true;
  }
}

module.exports = class GameState {
  constructor() {
    // is this good enough?
    this.availablePlayerIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    this.players = {};

    const hZoneSize = configs.shared.mapWidth / configs.shared.zoneWidth;
    const vZoneSize = configs.shared.mapHeight / configs.shared.zoneHeight;

    if (!util.isInt(hZoneSize) || !util.isInt(vZoneSize)) {
      throw new Error('Invalid game config: The game currently require all zones to be same size with no left over region.');
    }

    this.field = new Field(hZoneSize, vZoneSize, configs.shared.zoneWidth, configs.shared.zoneHeight);
  }

  conquerZone(player) {
    this.field.conquerZone(1, player.position);
  }

  // process players movement and actions
  tick() {
    // process tick for each player in game
    Object.values(this.players).forEach((player) => {
      if (player.isKilled) { // remove killed players from game
        delete this.players[player.id];
      } else {
        const currSnapshot = player.snapshotQueue.shift();

        if (!currSnapshot)
          return;

        // must do actionTick before movementTick since action could override movment!
        player.actionTick(currSnapshot, this); // pass in entire snapshot since movement is needed for dash
        player.movementTick(currSnapshot.movement, this);
      }
    });

    // TODO: zones logic tick
  }

  // pass in player obj
  join() {
    // TODO: implement unique ID logic
    const playerId = this.availablePlayerIds.shift();

    if (!playerId)
      throw new Error('Game is full as no player id is available!');

    const initPosition = new Coord(
      util.randomIntFromInterval(0, configs.shared.mapWidth),
      util.randomIntFromInterval(0, configs.shared.mapHeight)
    );

    const newPlayer = new Player(playerId, initPosition);

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
