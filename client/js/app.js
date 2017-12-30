require('../css/app.css');
// require('../../semantic/dist/semantic.min.css');
// require('../../semantic/dist/semantic.min.js');
// require('./ui/leaderboard');

const configs = require('../../app-configs');
const control = require('./control');
const debug = require('../../shared/debug');
const global = require('./global');
const axios = require('axios');
const statusController = require('./status-controller');
const ui = require('./ui');
const Game = require('./game');

const canvas = document.getElementById('canvas');
control.trackKeysInput(canvas);
control.trackMouseDirectionInput(canvas);

let ws;

const host = window.location.hostname;

const serverUrl = `http://${host}:${configs.shared.port}`;
const wsUrl = `ws://${host}:${configs.shared.port}`;

const establishWS = passcode => new Promise((resolve, reject) => {
  ws = new WebSocket(wsUrl);
  let clientPlayerId;
  let game;

  setTimeout(() => reject(new Error('Could not set up websocket in time')), configs.client.initJoinTimeout);

  ws.onopen = () => {
    const payload = JSON.stringify({ type: 'join', data: { passcode: passcode } });
    ws.send(payload);
  };

  ws.onmessage = (evt) => {
    const { type, data } = JSON.parse(evt.data);

    switch (type) {
      case 'joinAck':
        clientPlayerId = data.id;
        game = new Game(ws, clientPlayerId);
        statusController.setGame(game);

        // immediately send sync request on join
        // ws.send(JSON.stringify({ type: 'syncReq' }));

        // Do this in promise chain to prevent going to game view if join init failed
        // statusController.toStandbyMenu(clientPlayerId);

        resolve();
        break;
      case 'syncAck':
        game.sync(data);
        ws.send(JSON.stringify({ type: 'syncAck2' }));
        break;
      case 'playAck':
        statusController.toPlaying();
        break;
      case 'gameStateSnapshot':
        debug.logGameStatePacketReceiveRate(200);
        // global.set('gameState', data);
        game.insertGameStateSnapshot(data);
        break;
      default:
        throw new Error(`Received invalid message type from server: ${type}`);
    }
    // console.log('Receive from WS', data);
  };

  ws.onclose = () => {
    console.log('Websocket to server closed');
    statusController.toMainMenu();
  };

  window.onbeforeunload = () => ws.close();
});

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

// start with Main Menu
statusController.toMainMenu();

ui.registerOnJoinButtonClick(() => {
  joinServer(`${serverUrl}/join`)
    .then(establishWS)
    .then(() => {
      statusController.toStandbyMenu();
    })
    .catch(err => console.log('Error joining server', err));
});

ui.registerOnPlayButtonClick(() => {
  const name = $('#nameInput').val();
  // const gameState = global.get('gameState');

  const joinPayload = {
    type: 'play',
    data: {
      name: name
    }
  };

  ws.send(JSON.stringify(joinPayload));
});
