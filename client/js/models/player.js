const Coord = require('../../../shared/models/coord')

module.exports = class Player {
  constructor(x, y) {
    this.position = new Coord(x, y)
    this.actions = {}
  }
}
