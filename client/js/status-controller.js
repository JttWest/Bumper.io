const appStatus = require('../../shared/enums').client.appStatus;
const ui = require('./ui');
const control = require('./control');
const configs = require('../../app-configs');
const leaderboard = require('./dashboard/leaderboard');

let game;
let currentStatus = appStatus.MAIN;

const leaderboardLoop = () => {
  if (currentStatus === appStatus.STANDBY || currentStatus === appStatus.PLAYING) {
    setTimeout(leaderboardLoop, configs.client.leaderboardUpdatehInterval);

    const players = game.getCurrentPlayers();

    if (players)
      leaderboard.update(players);
  }
};

const renderLoop = () => {
  if (currentStatus === appStatus.STANDBY || currentStatus === appStatus.PLAYING) {
    requestAnimationFrame(renderLoop);

    game.render();
  }
};

const controlLoop = () => {
  if (currentStatus === appStatus.PLAYING) {
    setTimeout(controlLoop, configs.shared.tickInterval);

    const clientPlayer = game.getCurrentClient();

    if (clientPlayer) {
      const controlInput = control.getUserInputData(clientPlayer.position);

      // dont brother sending snapshot if no movement since its throw away at server
      if (controlInput.movement !== null)
        game.sendControlInput(controlInput);
    }
  }
};

const gameLoop = () => {
  if (currentStatus === appStatus.STANDBY || currentStatus === appStatus.PLAYING) {
    setTimeout(gameLoop, configs.shared.tickInterval);

    game.tick();
  }
};

function toMainMenu() {
  currentStatus = appStatus.MAIN;

  ui.enableJoinButton();
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

  ui.enablePlayButton();
  ui.gameView();
  ui.showStandbyMenu();

  // start loops if coming from MAIN
  if (oldStatus === appStatus.MAIN) {
    gameLoop();
    renderLoop();
    leaderboardLoop();
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

  controlLoop();
}

module.exports = {
  toMainMenu,
  toStandbyMenu,
  toPlaying,
  setGame: (g) => {
    game = g;
  }
};
