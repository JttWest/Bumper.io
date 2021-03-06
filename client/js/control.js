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

const getMovementData = (clientPlayerPosition) => {
  const deltaX = mouseX - clientPlayerPosition.x;
  const deltaY = mouseY - clientPlayerPosition.y;

  // TODO:
  // if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10)
  //   return null;

  return Math.atan2(deltaY, deltaX); // returns value between PI and -PI radians
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
const getUserInputData = (clientPlayerPosition) => {
  const movement = getMovementData(clientPlayerPosition);
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
