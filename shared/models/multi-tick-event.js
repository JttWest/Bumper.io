module.exports = class MultiTickEvent {
  /**
   * @param {number} countdown how many ticks till the event
   * @param {number} duration how long the event lasts
   * @param {number} cooldown how long before event can start again
   */
  constructor(countdown, duration, cooldown) {
    // track original values for reset
    this.originalCountdown = countdown;
    this.originalDuration = duration;
    this.originalCooldown = cooldown;

    // these values will update as the counter ticks
    this.countdown = countdown;
    this.duration = duration;
    this.cooldown = cooldown;
  }

  reset() {
    this.countdown = this.originalCountdown;
    this.duration = this.originalDuration;
    this.cooldown = this.originalCooldown;
  }

  tick() {
    if (this.countdown > 0)
      this.countdown--;
    else if (this.duration > 0)
      this.duration--;
    else if (this.cooldown > 0)
      this.cooldown--;
  }

  excuteResult() {
    this.executed = true;
  }

  isReadyToExecute() {
    return !this.executed && this.countdown <= 0; // has not yet been excuted and is ready to do so
  }

  isCompleted() {
    return this.executed && this.duration <= 0; // has been excuted and no duration left
  }

  isCooldownOver() {
    return this.executed && this.cooldown <= 0;
  }
};
