require('../css/app.css');

const configs = require('../../app-configs');
const control = require('./control');
const debug = require('../../shared/debug');
const axios = require('axios');
const statusController = require('./status-controller');
const ui = require('./ui');
const Game = require('./game');
const codec = require('../../shared/codec');

const canvas = document.getElementById('canvas');
control.trackKeysInput(canvas);
control.trackMouseDirectionInput(canvas);

const host = window.location.hostname;

const serverUrl = `http://${host}:${configs.shared.port}`;
const wsUrl = `ws://${host}:${configs.shared.port}`;

const establishWS = passcode => new Promise((resolve, reject) => {
  const ws = new WebSocket(wsUrl);
  ws.binaryType = 'arraybuffer';

  let clientPlayerId;
  let game;

  setTimeout(() => reject(new Error('Could not set up websocket in time')), configs.client.initJoinTimeout);

  ws.onopen = () => {
    const payload = JSON.stringify({ type: 'join', data: { passcode: passcode } });
    ws.send(payload);
  };

  ws.onmessage = (evt) => {
    // only gameStateSnapshot is in binary format ATM
    if (evt.data instanceof ArrayBuffer) {
      debug.logGameStatePacketReceiveRate(200);
      game.insertGameStateSnapshot(codec.gameStateSnapshot.decode(evt.data));
      return;
    }

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
      // case 'gameStateSnapshot':
      //   debug.logGameStatePacketReceiveRate(200);
      //   game.insertGameStateSnapshot(data);
      //   break;
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
    let errMessage;
    if (error.response) {
      // Response code outside of 2xx
      errMessage = error.response.data.message;
    } else {
      errMessage = 'Unknown error occured';
    }

    console.log('Error joining server', error);

    throw new Error(errMessage);
  });


// ---------------------------- UI ----------------------------------- //

ui.setCanvasSize(configs.shared.mapWidth, configs.shared.mapHeight);

// start with Main Menu
statusController.toMainMenu();

ui.registerOnJoinButtonClick(() => {
  ui.disableAndLoadJoinButton();

  setTimeout(() => {
    joinServer(`${serverUrl}/join`)
      .then(establishWS)
      .then((ws) => {
        // register play with the connected websocket
        ui.registerOnPlayButtonClick(() => {
          const name = $('#nameInput').val();

          if (!name) {
            ui.showErrorMessage('Please enter a name.');
          } else if (name.length > 10) {
            ui.showErrorMessage('Name too long.');
          } else {
            ui.disableAndLoadPlayButton();

            const joinPayload = {
              type: 'play',
              data: {
                name: name
              }
            };

            ws.send(JSON.stringify(joinPayload));
          }
        });

        statusController.toStandbyMenu();
      })
      .catch((err) => {
        let errMessage;
        if (err.message)
          errMessage = err.message;
        else
          errMessage = 'Unknown error.';

        ui.showErrorMessage(errMessage);
        ui.enableJoinButton();
      });
  }, 500);
});

