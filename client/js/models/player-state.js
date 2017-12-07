const configs = require('../../../game-configs.json');

module.exports = class PlayerState {
  constructor(name) {
    this.name = name;
    this.position = null;
    this.snapshotQueue = [];
  }

  processSnapshots(snapshots) {
    snapshots.forEach((snapshot) => {
      this.processPlayerMove(snapshot.movement);
    });
  }

  processPlayerMove(movement) {
    if (movement.left)
      this.position.x -= configs.shared.playerSpeed;

    if (movement.right)
      this.position.x += configs.shared.playerSpeed;

    if (movement.up)
      this.position.y -= configs.shared.playerSpeed;

    if (movement.down)
      this.position.y += configs.shared.playerSpeed;
  }
};
