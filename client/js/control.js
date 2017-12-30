const configs = require('../../app-configs');
const global = require('./global');
const appStatus = require('../../shared/enums').client.appStatus;

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
  // const player = global.get('clientPlayer');

  // TODO: temp
  const originX = 300;
  const originY = 300;

  const deltaX = mouseX - originX;
  const deltaY = mouseY - originY;

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

/*
  input data object format:
  {
    movement: NUMBER
    keysPressed: STRING
  }
*/
const getUserInputData = () => {
  const movement = getMovementData();
  const action = getActionData();

  return { movement, action };
};

module.exports = {
  keyboardCodeMapping,

  trackKeysInput(element) {
    element.addEventListener('keydown', (event) => {
      keyRegister[event.keyCode] = true;
      event.preventDefault();
    });

    element.addEventListener('keyup', (event) => {
      keyRegister[event.keyCode] = false;
    });
  },

  trackMouseDirectionInput(element) {
    element.addEventListener('mousemove', (event) => {
      mouseX = event.offsetX;
      mouseY = event.offsetY;
    });
  },

  getUserInputData
};
