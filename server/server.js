const express = require('express');
const WebSocket = require('ws');
const httpStatus = require('http-status-codes');
const path = require('path');
const configs = require('../app-configs');
const GameRoom = require('./models/game-room');
const uuidv4 = require('uuid/v4');

const PORT = process.env.PORT || configs.shared.port;

const gameRooms = Array.from(new Array(configs.server.gameRoom.maxRooms), (_, id) => new GameRoom(id));

// maps passcode to the player that has been created for that code
const passcodeManager = new Map();

const server = express();
const router = express.Router();

router.route('/ping').get((req, res) => {
  res.status(httpStatus.OK).end();
});

// TODO: think about whether this should be kept
router.route('/room/:roomId').get((req, res) => {
  const roomId = req.params.roomId;
  const gameRoom = gameRooms[roomId];

  if (!gameRoom)
    res.status(httpStatus.NOT_FOUND).json({ message: `There is no room with id: ${roomId}` });

  res.status(httpStatus.OK).send({
    roomId: gameRoom.roomId,
    availablePlayerIds: gameRoom.availablePlayerIds,
    playerIds: Array.from(gameRoom.players.keys()),
    inGamePlayers: Array.from(Object.values(gameRoom.gameState.players))
  });
});

router.route('/join').get((req, res) => {
  // put user into 1 of the game rooms
  for (let i = 0; i < gameRooms.length; ++i) {
    const gameRoom = gameRooms[i];
    if (gameRoom.hasAvailableSpot()) {
      const player = gameRoom.join();
      const passcode = uuidv4();

      passcodeManager.set(passcode, { player: player });
      // expire the passcode after a delay
      setTimeout(() => passcodeManager.delete(passcode), configs.server.passcodeExpiration);

      // client will immediately use this passcode to connect to the websocket on this server
      res.status(httpStatus.OK).json({ passcode });
      return;
    }
  }

  res.status(httpStatus.BAD_REQUEST).json({ message: 'No available spot' });
});

server.use(express.static(path.join(__dirname, '../dist'))); // serve the game files
server.use('/', router);
server.listen(PORT, () => console.log(`Listening on ${PORT}`));

// const server = http.createServer(app);
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  let player;

  ws.on('message', (message) => {
    // make sure data from client is valid
    try { // TODO: move these logic to seperate file
      const { type, data } = JSON.parse(message);

      switch (type) {
        // used to establish websocket connection b/w client and server
        case 'join': {
          const { passcode } = data;
          const initPlayerData = passcodeManager.get(passcode);

          if (!initPlayerData) {
            throw new Error(`Expired or non-existant passcode: ${passcode}`);
          } else {
            player = initPlayerData.player;
            player.ws = ws;

            passcodeManager.delete(passcode); // prevent the code from being use again
          }
          break;
        }
        // puts the player into the game and start playing
        case 'play': {
          if (!player)
            throw new Error(`Player doesn't exist for websocket at ip: ${req.connection.remoteAddress}`);

          const { name } = data;
          player.playerState = gameRooms[player.roomId].gameState.play(name, player.id);
          break;
        }
        default:
          console.log(`Received invalid message type from client: ${type}`);
      }
    } catch (e) {
      console.log(e);
      ws.terminate();
    }
  });
});

setInterval(() => {
  gameRooms.forEach((gameRoom) => {
    gameRoom.tick();
  });
}, configs.shared.tickInterval);
