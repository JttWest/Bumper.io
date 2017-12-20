const playerActionFactory = require('./player-action').factory;
const configs = require('../../app-configs').shared;

module.exports = class Player {
  constructor(id, name, position) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.snapshotQueue = [];
    this.actions = {}; // current actions in progress
    this.isKilled = false; // used to mark player for clean up
    this.velocity = { x: 0, y: 0 };
    this.speed = configs.playerSpeed;
    this.direction = 0;
    this.mass = 1;
    this.overridePlayerControl = 0; // how to long to override player control
    this.collision = {
      collidedWith: null,
      duration: 0,
    };
    this.points = 0;
  }

  move(dx, dy) {
    // let players move anywhere; check is done in gameState tick to kill players out of bound
    this.position.x += dx;
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
      this.actions[action] = playerActionFactory(action);
    }
  }

  movementTick() {
    this.move(this.velocity.x, this.velocity.y);
  }

  actionTick() {
    Object.keys(this.actions).forEach((actionName) => {
      const action = this.actions[actionName];

      if (action.isReadyToExecute())
        action.executeEvent(this);
      else if (action.isCompleted() && action.isCooldownOver())
        delete this.actions[actionName];
      else
        action.tick();
    });
  }

  tick() {
    if (this.overridePlayerControl)
      this.overridePlayerControl--;

    this.movementTick();
    this.actionTick();
  }

  killed() {
    this.isKilled = true;

    if (this.collision.collidedWith)
      console.log(`${this.id} killed by ${this.collision.collidedWith}`);
  }


};
