const Coord = require('./coord');
const configs = require('../../app-configs').shared;
const util = require('../util');
const Zone = require('./zone');

module.exports = class Field {
  constructor(numZonesH, numZonesV, zoneWidth, zoneHeight) {
    this.numZonesH = numZonesH;
    this.numZonesV = numZonesV;
    this.zoneWidth = zoneWidth;
    this.zoneHeight = zoneHeight;

    this.zones = [];
    this.numberOnZones = 0;

    for (let i = 0; i < numZonesH * numZonesV; ++i) {
      const zoneCoord = new Coord(i % numZonesH * zoneWidth, Math.floor(i / numZonesH) * zoneHeight);
      this.zones.push(new Zone(zoneCoord));
    }
  }

  getZoneByCoord(coord) {
    // get index by calculating starting row index then adding column offset
    const zoneIndex = (Math.floor(coord.y / this.zoneHeight) * this.numZonesH) + Math.floor(coord.x / this.zoneWidth);

    return this.zones[zoneIndex];
  }

  getZoneByIndex(rowIndex, columnIndex) {
    const zoneIndex = (rowIndex * this.numZonesH) + columnIndex;

    return this.zones[zoneIndex];
  }

  tick() {
    this.numberOnZones = 0;

    // look at how many zones are currently on
    this.zones.forEach((zone) => {
      zone.tick();
      if (zone.isOn() || zone.isTransitioning())
        this.numberOnZones++;
    });

    // turn on a random zone there's not enough
    if (this.numberOnZones < configs.maxOnZones) {
      const randZoneIndex = util.randomIntFromInterval(0, (this.numZonesH * this.numZonesV) - 1);
      this.zones[randZoneIndex].setOn();
    }
  }
};
