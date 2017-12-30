const appStatus = require('../../shared/enums').client.appStatus;
const ui = require('./ui');
const global = require('./global');
const graphics = require('./graphics');
const control = require('./control');
const configs = require('../../app-configs');

let game;

const toMainMenu = () => {
  global.setAppStatus(appStatus.MAIN);

  ui.mainView();
  ui.hideStandbyMenu();

  game = null;
};

const renderLoop = () => {
  if (global.getAppStatus() === appStatus.STANDBY || global.getAppStatus() === appStatus.PLAYING) {
    game.renderGameSnapshot();

    requestAnimationFrame(renderLoop);
  }
};

const gameLoop = () => {
  if (global.getAppStatus() === appStatus.STANDBY || global.getAppStatus() === appStatus.PLAYING) {
    game.tick();

    // if (global.getAppStatus() === appStatus.PLAYING)
    // control.sendUserInputLoop(clientWebsocket);

    setTimeout(gameLoop, configs.shared.tickInterval);
  }
};

const toStandbyMenu = () => {
  const oldStatus = global.getAppStatus();

  if (oldStatus !== appStatus.MAIN && oldStatus !== appStatus.PLAYING)
    throw new Error('Must be in MAIN/PLAYING to change status to STANDBY');

  if (!game)
    throw new Error('No Game initialized in Status Controller');

  global.setAppStatus(appStatus.STANDBY);

  ui.gameView();

  ui.showStandbyMenu();

  // start rendering if coming from MAIN
  if (oldStatus === appStatus.MAIN) {
    gameLoop(); // game tick happens here
    renderLoop();
  }
};

const toPlaying = () => {
  if (global.getAppStatus() !== appStatus.STANDBY)
    throw new Error('Must be in STANDBY to change status to PLAYING');

  if (!game)
    throw new Error('No Game initialized in Status Controller');


  global.setAppStatus(appStatus.PLAYING);

  ui.hideStandbyMenu();

  $('#canvas').focus();
};

module.exports = {
  toMainMenu,
  toStandbyMenu,
  toPlaying,
  setGame: (g) => {
    game = g;
  }
};
