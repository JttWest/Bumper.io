module.exports = {
  isInt: n => Number.isInteger(n),

  randomIntFromInterval: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),

  randBool: () => Math.random() >= 0.5,

  isNegativeNumber: number => number < 0
}
