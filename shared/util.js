module.exports = {
  isInt: n => Number.isInteger(n),

  randomIntFromInterval: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),

  randomFloatFromInterval: (min, max) => Math.random() * (max - min) + min,

  randBool: () => Math.random() >= 0.5,

  isNegativeNumber: number => number < 0,

  radianToDegree: radian => radian * (180 / Math.PI),

  degreeToRadian: degree => degree * (Math.PI / 180),

  isBot: playerState => playerState.id < 0
};
