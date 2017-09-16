const keyRegister = {}

// list of available input keys
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

let mouseX
let mouseY

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

const getActionData = () => {
  let action = null

  if (keyRegister[keyboardCodeMapping.B]) {
    action = 'attack'
  }

  if (keyRegister[keyboardCodeMapping.N]) {
    action = 'conquer'
  }

  if (keyRegister[keyboardCodeMapping.M]) {
    action = 'dash'
  }

  return action
}

module.exports = {
  keyboardCodeMapping,

  registerKeysInput(element) {
    element.addEventListener('keydown', (event) => {
      keyRegister[event.keyCode] = true
    })

    element.addEventListener('keyup', (event) => {
      keyRegister[event.keyCode] = false
    })
  },

  registerMouseDirectionInput(element) {
    element.addEventListener('mousemove', (event) => {
      mouseX = event.offsetX
      mouseY = event.offsetY
    })
  },

  /**
  returns input data object:
  {
    movement: {}
    keysPressed: []
  }
  */
  getUserInputData: () => {
    const movement = getMovementData()
    const action = getActionData()

    return { movement, action }
  }
}
