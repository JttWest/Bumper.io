const global = require('./global');

const keyRegister = {};

// list of available input keys
const keyboardCodeMapping = {
  W: 87,
  A: 65,
  S: 83,
  D: 68,
  B: 66,
  N: 78,
  M: 77,
  Q: 81,
  SPACE: 32
};

let mouseX = 0;
let mouseY = 0;

const getMovementData = () => {
  const player = global.get('player');

  const deltaX = mouseX - player.position.x;
  const deltaY = mouseY - player.position.y;

  return Math.atan2(deltaY, deltaX);
};

const getActionData = () => {
  let action = null;

  // if (keyRegister[keyboardCodeMapping.Q]) {
  //   action = 'attack';
  // }

  // if (keyRegister[keyboardCodeMapping.N]) {
  //   action = 'conquer';
  // }

  if (keyRegister[keyboardCodeMapping.SPACE]) {
    action = 'dash';
  }

  return action;
};

module.exports = {
  keyboardCodeMapping,

  registerKeysInput(element) {
    element.addEventListener('keydown', (event) => {
      keyRegister[event.keyCode] = true;
    });

    element.addEventListener('keyup', (event) => {
      keyRegister[event.keyCode] = false;
    });
  },

  registerMouseDirectionInput(element) {
    element.addEventListener('mousemove', (event) => {
      mouseX = event.offsetX;
      mouseY = event.offsetY;
    });
  },

  /**
  returns input data object:
  {
    movement: {}
    keysPressed: []
  }
  */
  getUserInputData: () => {
    const movement = getMovementData();
    const action = getActionData();

    return { movement, action };
  }
};
