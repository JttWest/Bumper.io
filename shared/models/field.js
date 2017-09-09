const Coord = require('./coord')

/**
 * claimed zone has the playerId in it, which are greater than 0
 */
const zoneStatus = {
  UNCLAIMED: -1,
  BLOCKED: -2
}

module.exports = class Field {
  constructor(horizontalSize, verticalSize, zoneWidth, zoneHeight) {
    this.horizontalSize = horizontalSize
    this.verticalSize = verticalSize
    this.zoneWidth = zoneWidth
    this.zoneHeight = zoneHeight

    // this.zones = Array(horizontalSize * verticalSize).fill(zoneType.UNCLAIMED)
    this.zones = []

    for (let i = 0; i < horizontalSize * verticalSize; ++i) {
      const zoneCoord = new Coord(i % horizontalSize * zoneWidth, Math.floor(i / horizontalSize) * zoneHeight)
      const zone = { coord: zoneCoord, status: zoneStatus.UNCLAIMED }

      this.zones.push(zone)
    }
  }

  conquerZone(playerId, coord) {
    const zone = this.getZoneByCoord(coord)

    zone.status = playerId
  }

  getZoneByCoord(coord) {
    // get index by calculating starting row index then adding column offset
    const zoneIndex = (Math.floor(coord.y / this.zoneHeight) * this.horizontalSize) + Math.floor(coord.x / this.zoneWidth)

    return this.zones[zoneIndex]
  }

  getZoneByIndex(rowIndex, columnIndex) {
    const zoneIndex = (rowIndex * this.horizontalSize) + columnIndex

    return this.zones[zoneIndex]
  }
}
