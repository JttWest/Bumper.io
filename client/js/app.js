require('../css/app.css');
require('../../semantic/dist/semantic.min.css');
require('../../semantic/dist/semantic.min.js');
// require('./ui/leaderboard');

const configs = require('../../app-configs');
const control = require('./control');
const debug = require('./debug');
const graphics = require('./graphics');
const global = require('./global');
const axios = require('axios');

// const GameState = require('../../shared/models/game-state');
// const gameState = new GameState();
// global.set('gameState', gameState);
global.setAppStatus('MAIN'); // TODO: intergrate main menu logic

const canvas = document.getElementById('canvas');
control.trackKeysInput(canvas);
control.trackMouseDirectionInput(canvas);

let ws;

const serverUrl = 'http://localhost:3000';
const wsEndpoint = 'ws://localhost:3000';

const playGame = (websocket) => {
  const inputPayload = {
    type: 'controlInput',
    data: control.getUserInputData()
  };

  websocket.send(JSON.stringify(inputPayload));

  if (global.getAppStatus() === 'PLAYING')
    setTimeout(playGame, configs.shared.tickInterval, websocket);
};

const establishWS = (passcode) => {
  ws = new WebSocket(wsEndpoint);

  ws.onopen = () => {
    const payload = JSON.stringify({ type: 'join', data: { passcode: passcode } });
    ws.send(payload);
  };

  ws.onmessage = (evt) => {
    const { type, data } = JSON.parse(evt.data);

    switch (type) {
      case 'joinAck':
        global.setAppStatus('STANDBY');

        graphics.renderLoop();
        break;
      case 'playAck':
        global.setAppStatus('PLAYING');

        // start sending client game input data to server
        playGame(ws);
        break;
      case 'gameStateSnapshot':
        global.set('gameState', data);
        break;
      default:
        throw new Error(`Received invalid message type from server: ${type}`);
    }
    // console.log('Receive from WS', data);
  };

  ws.onclose = () => console.log('Websocket to server closed');

  window.onbeforeunload = () => ws.close();
};

const joinServer = endpoint => axios.get(endpoint)
  .then((response) => {
    const { passcode } = response.data;
    return passcode;
  })
  .catch((error) => {
    if (error.response) {
      // Response code outside of 2xx
      console.log('Error', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('Timeout', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Set up failed', error.message);
    }

    throw new Error('Failed to join game.');
  });


// ---------------------------- UI ----------------------------------- //

// hide game view and show only main menu on start
$('#gameView').hide();

const showStandbyMenu = () => {
  $('#standbyMenu')
    .modal({
      inverted: true,
      transition: 'scale'
    })
    .modal('show');
};

const onJoinButtonClick = () => {
  joinServer(`${serverUrl}/join`)
    .then(establishWS)
    .then(() => {
      $('#mainMenu').hide();
      $('#gameView').show();

      showStandbyMenu();
    })
    .catch(err => console.log('Error joining server', err));
};

const onPlayButtonClick = () => {
  const name = $('#nameInput').val();
  // const gameState = global.get('gameState');

  const joinPayload = {
    type: 'play',
    data: {
      name: name
    }
  };

  ws.send(JSON.stringify(joinPayload));
  // const clientPlayer = gameState.play(name);

  // global.set('clientPlayer', clientPlayer);
  global.setAppStatus('PLAYING');

  $('#standbyMenu')
    .modal('hide');

  $('#canvas').focus();
};

$('#joinButton').click(onJoinButtonClick);
$('#playButton').click(onPlayButtonClick);
