const keyRegister = {}

const keyboardCodeMapping = {
  W: 87,
  A: 65,
  S: 83,
  D: 68,
  B: 66,
  N: 78,
  M: 77,
  SPACE: 32
}

const getMovementData = () => {
  const movement = { left: false, right: false, up: false, down: false }

  if (keyRegister[keyboardCodeMapping.W])
    movement.up = true

  if (keyRegister[keyboardCodeMapping.S])
    movement.down = true

  if (keyRegister[keyboardCodeMapping.A])
    movement.left = true

  if (keyRegister[keyboardCodeMapping.D])
    movement.right = true

  return movement
}

module.exports = {
  keyboardCodeMapping,

  onKeydown: (event) => {
    keyRegister[event.keyCode] = true
  },

  onKeyup: (event) => {
    keyRegister[event.keyCode] = false
  },

  /*
  *
  */
  getUserInputData: () => {
    const movement = getMovementData()

    return { movement }
  }
}
