// const PlayerState = require('./player-state.js')
const configs = require('../../game-configs.json').shared;
const Field = require('./field');
const util = require('../util');
const Coord = require('./coord');
const actionFactory = require('../actions').factory;
const physics = require('../physics');

class Player {
  constructor(id, position) {
    this.id = id;
    this.position = position;
    this.snapshotQueue = [];
    this.actions = {}; // current actions in progress
    this.isKilled = false; // flag to mark player for clean up
    this.velocity = { x: 0, y: 0 };
    this.speed = configs.playerSpeed;
    this.direction = 0;
    this.mass = 1;
    this.overridePlayerControl = 0; // how to long to override player control
  }

  move(dx, dy) {
    if (util.isNegativeNumber(dx) && this.position.x + dx < 0) // moving left out of map
      this.position.x = 0;
    else if (!util.isNegativeNumber(dx) && this.position.x + dx > configs.mapWidth) // moving right out of map
      this.position.x = configs.mapWidth;
    else
      this.position.x += dx;

    if (util.isNegativeNumber(dy) && this.position.y + dy < 0) // moving up out of map
      this.position.y = 0;
    else if (!util.isNegativeNumber(dy) && this.position.y + dy > configs.mapHeight) // moving down out of map
      this.position.y = configs.mapHeight;
    else
      this.position.y += dy;
  }

  insertSnapshot(movement, action) {
    this.snapshotQueue.push({ movement, action });
  }

  processSnapshot(snapshot) {
    const angle = snapshot.movement;

    this.velocity.x = this.speed * Math.cos(angle);
    this.velocity.y = this.speed * Math.sin(angle);

    const action = snapshot.action;

    // create the requested new action if it's not already in progress
    if (action && !this.actions[action]) {
      this.actions[action] = actionFactory(snapshot);
    }
  }

  // movementTick() {
  //   // movement has been override by action or doesn't have movment angle
  //   if (this.overrideMovement)
  //     return;

  //   // const dx = configs.playerSpeed * Math.cos(angle);
  //   // const dy = configs.playerSpeed * Math.sin(angle);
  //   this.move(this.velocity.x, this.velocity.y);
  // }

  tick() {
    if (this.overridePlayerControl)
      this.overridePlayerControl--;

    // action tick
    Object.keys(this.actions).forEach((actionName) => {
      const action = this.actions[actionName];

      if (action.isReadyToExecute())
        action.executeResult(this);
      else if (action.isCompleted() && action.isCooldownOver())
        delete this.actions[actionName];
      else
        action.tick();
    });

    // movement tick
    // if (!this.overrideMovement)
    this.move(this.velocity.x, this.velocity.y);
  }

  /**
   *  actionData: string
   */
  // actionTick(snapshot, gameState) {
  //   // create the requested new action if it's not already in progress
  //   if (snapshot.action && !this.actions[snapshot.action]) {
  //     this.actions[snapshot.action] = actionFactory(snapshot);
  //   }

  //   Object.keys(this.actions).forEach((actionName) => {
  //     const action = this.actions[actionName];

  //     if (action.isReadyToExecute())
  //       action.executeResult(this, gameState); // pass in gameState since action can affect/modify the game state
  //     else if (action.isCompleted() && action.isCooldownOver())
  //       delete this.actions[actionName];
  //     else
  //       action.tick();
  //   });
  // }

  killed() {
    this.isKilled = true;
  }
}

module.exports = class GameState {
  constructor() {
    // is this good enough?
    this.availablePlayerIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
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

  // process players movement and actions
  tick() {
    // process tick for each player in game
    Object.values(this.players).forEach((player) => {
      if (player.isKilled) { // remove killed players from game
        delete this.players[player.id];
        console.log(`Player ${player.id} killed`);
      } else {
        const currSnapshot = player.snapshotQueue.shift();

        // uppdate current player's state with snapshot data
        if (currSnapshot && !player.overridePlayerControl)
          player.processSnapshot(currSnapshot);

        // must do actionTick before movementTick since action could override movment!
        // player.actionTick(currSnapshot, this); // pass in entire snapshot since movement is needed for dash
        player.tick();
      }
    });

    // for each player in game -> apply movement + set action
    // for each player in game -> check whether they have collided with another player
    //    if collided -> set resolve movement direction (for the player himself only)
    Object.values(this.players).forEach((player) => {
      Object.values(this.players).forEach((otherPlayer) => {
        // only resolve collision when player is dashing
        if (player.id !== otherPlayer.id && player.actions.dash && physics.checkCollision(player, otherPlayer)) {
          console.log(`${player.id} collided with ${otherPlayer.id}`);

          if (player.overridePlayerControl < configs.collisionOverrideDuration)
            player.overridePlayerControl = configs.collisionOverrideDuration;

          if (otherPlayer.overridePlayerControl < configs.collisionOverrideDuration)
            otherPlayer.overridePlayerControl = configs.collisionOverrideDuration;

          physics.resolveCollision(player, otherPlayer);
        }
      });
    });
  }

  // pass in player obj
  join() {
    // TODO: implement unique ID logic
    const playerId = this.availablePlayerIds.shift();

    if (!playerId)
      throw new Error('Game is full as no player id is available!');

    const initPosition = new Coord(
      util.randomIntFromInterval(0, configs.mapWidth),
      util.randomIntFromInterval(0, configs.mapHeight)
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
