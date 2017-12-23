const appStatus = require('../../shared/enums').client.appStatus;
const menu = require('./menu');
const global = require('./global');
const graphics = require('./graphics');
const control = require('./control');
const configs = require('../../app-configs');

const toMainMenu = () => {
  if (global.getAppStatus() !== appStatus.MAIN && global.getAppStatus() !== appStatus.STANDBY)
    throw new Error('Must be in MAIN/STANDBY to change status to MAIN');

  global.setAppStatus(appStatus.MAIN);

  $('#mainMenu').show();
  $('#gameView').hide();
};

const toStandbyMenu = (clientPlayerId) => {
  const oldStatus = global.getAppStatus();

  if (oldStatus !== appStatus.MAIN && oldStatus !== appStatus.PLAYING)
    throw new Error('Must be in MAIN/PLAYING to change status to STANDBY');

  global.setAppStatus(appStatus.STANDBY);

  $('#mainMenu').hide();
  $('#gameView').show();

  menu.showStandbyMenu();

  global.set('clientPlayerId', clientPlayerId);

  // start rendering if coming from MAIN
  if (oldStatus === appStatus.MAIN)
    graphics.renderLoop(clientPlayerId);
};

const playLoop = (clientPlayerId, clientWebsocket) => {
  control.sendUserInputLoop(clientWebsocket);

  // current client's player is killed
  if (global.get('gameState').players.some(player => player.id === clientPlayerId && player.isKilled))
    toStandbyMenu();

  if (global.getAppStatus() === appStatus.PLAYING)
    setTimeout(playLoop, configs.shared.tickInterval, clientPlayerId, clientWebsocket);
};

const toPlaying = (clientPlayerId, clientWebsocket) => {
  if (global.getAppStatus() !== appStatus.STANDBY)
    throw new Error('Must be in STANDBY to change status to PLAYING');

  global.setAppStatus(appStatus.PLAYING);

  menu.hideStandbyMenu();

  $('#canvas').focus();

  // need to be in PLAYING
  playLoop(clientPlayerId, clientWebsocket);
};


module.exports = {
  toMainMenu,
  toStandbyMenu,
  toPlaying
};
