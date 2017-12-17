require('../css/app.css');
require('../../semantic/dist/semantic.min.css');
require('../../semantic/dist/semantic.min.js');
require('./ui/leaderboard'); // TODO: remove this

const configs = require('../../app-configs');
const control = require('./control');
const debug = require('./debug');
const graphics = require('./graphics');
const global = require('./global');
const menu = require('./menu');

const GameState = require('../../shared/models/game-state');
const BotManager = require('../../shared/models/bot-manager');

const gameState = new GameState();
global.set('gameState', gameState);
global.setAppStatus('STANDBY'); // TODO: intergrate main menu logic

const canvas = document.getElementById('canvas');
control.trackKeysInput(canvas);
control.trackMouseDirectionInput(canvas);

const numBots = 3;
const botManager = new BotManager(gameState);
botManager.createBots(numBots);


/*
Game Tick:
1. grab current user input for this tick and generate player snapshot from it
2. insert snapshot into Player object returned
3. process game state tick
*/
const gameLoop = () => {
  setTimeout(gameLoop, configs.shared.tickInterval);

  botManager.tick();

  // client is currently playing
  const clientPlayer = global.get('clientPlayer');

  if (clientPlayer && !clientPlayer.isKilled) {
    const { movement, action } = control.getUserInputData();
    clientPlayer.insertSnapshot(movement, action);
  }

  if (clientPlayer && clientPlayer.isKilled && global.getAppStatus() === 'PLAYING') {
    setTimeout(() => menu.showStandbyMenu(), 1000);
    global.setAppStatus('STANDBY');
  }

  if (global.getAppStatus() === 'PLAYING' || global.getAppStatus() === 'STANDBY')
    gameState.tick();
};

gameLoop();
graphics.renderLoop();

menu.showStandbyMenu();
