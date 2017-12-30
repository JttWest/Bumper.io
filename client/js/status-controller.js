const appStatus = require('../../shared/enums').client.appStatus;
const ui = require('./ui');
const global = require('./global');
const control = require('./control');
const configs = require('../../app-configs');
// const status = require('../../shared/enums').client.appStatus;

let game;
let currentStatus = appStatus.MAIN;

const renderLoop = () => {
  if (currentStatus === appStatus.STANDBY || currentStatus === appStatus.PLAYING) {
    requestAnimationFrame(renderLoop);

    game.render();
  }
};

const gameLoop = () => {
  if (currentStatus === appStatus.STANDBY || currentStatus === appStatus.PLAYING) {
    setTimeout(gameLoop, configs.shared.tickInterval);

    game.tick();

    if (currentStatus === appStatus.PLAYING) {
      if (game.isClientPlayerKilled()) {
        toStandbyMenu();
      } else {
        const controlInput = control.getUserInputData();
        game.sendControlInput(controlInput);
      }
    }
  }
};

function toMainMenu() {
  currentStatus = appStatus.MAIN;

  ui.mainView();
  ui.hideStandbyMenu();

  game = null;
}

function toStandbyMenu() {
  const oldStatus = currentStatus;

  if (oldStatus !== appStatus.MAIN && oldStatus !== appStatus.PLAYING)
    throw new Error('Must be in MAIN/PLAYING to change status to STANDBY');

  if (!game)
    throw new Error('No Game initialized in Status Controller');

  currentStatus = appStatus.STANDBY;

  ui.gameView();

  ui.showStandbyMenu();

  // start rendering if coming from MAIN
  if (oldStatus === appStatus.MAIN) {
    gameLoop(); // game tick happens here
    renderLoop();
  }
}

function toPlaying() {
  if (currentStatus !== appStatus.STANDBY)
    throw new Error('Must be in STANDBY to change status to PLAYING');

  if (!game)
    throw new Error('No Game initialized in Status Controller');


  currentStatus = appStatus.PLAYING;

  ui.hideStandbyMenu();

  $('#canvas').focus();
}

module.exports = {
  toMainMenu,
  toStandbyMenu,
  toPlaying,
  setGame: (g) => {
    game = g;
  }
};
