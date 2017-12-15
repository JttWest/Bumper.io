require('../css/app.css');
require('../../semantic/dist/semantic.min.css');
require('../../semantic/dist/semantic.min.js');
require('./menu');

const configs = require('../../game-configs.json');
const control = require('./control');
const key = require('./control').keyboardCodeMapping;
const debug = require('./debug');
const graphics = require('./graphics');
const global = require('./global');

const GameState = require('../../shared/models/game-state');
const BotManager = require('../../shared/models/bot-manager');

const gameState = new GameState();

const canvas = document.getElementById('canvas');

control.registerKeysInput(canvas);
control.registerMouseDirectionInput(canvas);

global.set('gameState', gameState);

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

  debug.logGameTickRate();

  botManager.tick();

  // client is currently playing
  const clientPlayer = global.get('clientPlayer');

  if (clientPlayer && !clientPlayer.isKilled) {
    const userInputs = control.getUserInputData();
    clientPlayer.insertSnapshot(userInputs.movement, userInputs.action);
  }

  gameState.tick();
};

gameLoop();

graphics.renderLoop();

/*
when user click play in standby menu
 start gameLoop and renderLoop
   if died -> show standby menu

*/

