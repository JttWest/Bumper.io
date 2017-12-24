const MultiTickEvent = require('./multi-tick-event');
const configs = require('../../app-configs').shared;
const util = require('../util');
const zoneStatus = require('../enums').shared.zoneStatus;

class ZoneStatusTransition extends MultiTickEvent {
  constructor(zone) {
    super(configs.zoneTransitionCountdown,
      util.randomIntFromInterval(configs.zone.minOnDuration, configs.zone.maxOnDuration),
      0);

    this.zone = zone;
  }

  executeEvent() {
    super.executeEvent();

    this.zone.status = zoneStatus.ON;
  }
}

module.exports = class Zone {
  constructor(coord) {
    this.coord = coord;
    this.status = zoneStatus.OFF;
    this.statusTransition = null;
  }

  setOn() {
    // do nothing if zone is on or is already going on
    if (this.status === zoneStatus.ON || this.statusTransition)
      return;

    this.statusTransition = new ZoneStatusTransition(this);
    this.status = zoneStatus.TRANSITION;
  }

  isOn() {
    return this.status === zoneStatus.ON;
  }

  isOff() {
    return this.status === zoneStatus.OFF;
  }

  isTransitioning() {
    return this.statusTransition !== null;
  }

  tick() {
    if (this.statusTransition) {
      this.statusTransition.tick();

      if (this.statusTransition.isReadyToExecute()) {
        this.statusTransition.executeEvent();
      } else if (this.status === zoneStatus.ON && this.statusTransition.isCompleted()) {
        this.status = zoneStatus.OFF;
      } else if (this.status === zoneStatus.OFF && this.statusTransition.isCooldownOver()) {
        this.statusTransition = null;
      }
    }
  }
};
