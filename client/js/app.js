import { setTimeout } from 'timers';

require('../css/app.css');
// require('./ui/leaderboard');

const configs = require('../../app-configs');
const control = require('./control');
const debug = require('../../shared/debug');
const axios = require('axios');
const statusController = require('./status-controller');
const ui = require('./ui');
const Game = require('./game');

const canvas = document.getElementById('canvas');
control.trackKeysInput(canvas);
control.trackMouseDirectionInput(canvas);

const host = window.location.hostname;

const serverUrl = `http://${host}:${configs.shared.port}`;
const wsUrl = `ws://${host}:${configs.shared.port}`;

const establishWS = passcode => new Promise((resolve, reject) => {
  const ws = new WebSocket(wsUrl);
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

        resolve(ws);
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
        game.insertGameStateSnapshot(data);
        break;
      case 'killed':
        setTimeout(statusController.toStandbyMenu, 500);
        break;
      default:
        throw new Error(`Received invalid message type from server: ${type}`);
    }
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
    .then((ws) => {
      // register play with the connected websocket
      ui.registerOnPlayButtonClick(() => {
        const name = $('#nameInput').val();

        const joinPayload = {
          type: 'play',
          data: {
            name: name
          }
        };

        ws.send(JSON.stringify(joinPayload));
      });

      statusController.toStandbyMenu();
    })
    .catch(err => console.log('Error joining server', err));
});
