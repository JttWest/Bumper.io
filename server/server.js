const http = require('http');
const express = require('express');
const helmet = require('helmet');
const WebSocket = require('ws');
const httpStatus = require('http-status-codes');
const path = require('path');
const configs = require('../app-configs');
const GameRoom = require('./models/game-room');
const uuidv4 = require('uuid/v4');
const cors = require('cors');
const debug = require('../shared/debug');

const PORT = process.env.PORT || configs.shared.port;

const gameRooms = Array.from(new Array(configs.server.gameRoom.maxRooms), (_, id) => new GameRoom(id));

// maps passcode to the player that has been created for that code
const passcodeManager = new Map();

const app = express();
const router = express.Router();

router.route('/ping').get((req, res) => {
  res.status(httpStatus.OK).end();
});

router.route('/room/:roomId').get((req, res) => {
  const roomId = req.params.roomId;
  const gameRoom = gameRooms[roomId];

  if (!gameRoom)
    res.status(httpStatus.NOT_FOUND).json({ message: `There is no room with id: ${roomId}` });

  res.status(httpStatus.OK).send({
    roomId: gameRoom.roomId,
    availablePlayerIds: gameRoom.availablePlayerIds,
    playerIds: Array.from(gameRoom.players.keys()),
    inGamePlayers: Array.from(Object.values(gameRoom.gameState.getSnapshot()))
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

app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, '../dist'))); // serve the game files
app.use('/', router);

const server = http.createServer(app);
server.listen(PORT, () => console.log('Listening on %d', server.address().port));

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  let player;

  ws.on('message', (message) => {
    // make sure data from client is valid
    try { // TODO: move these logic to seperate file
      const { type, data } = JSON.parse(message);

      // only time where player is not set should be the init join request
      if (type !== 'join' && !player)
        throw new Error(`Player doesn't exist for websocket at ip: ${req.connection.remoteAddress}`);

      if (player)
        player.numInactiveTicks = 0;

      switch (type) {
        // use to set the player variable for this websocket connection
        case 'join': {
          const { passcode } = data;
          const initPlayerData = passcodeManager.get(passcode);

          if (!initPlayerData) {
            throw new Error(`Expired or non-existant passcode: ${passcode}`);
          } else {
            player = initPlayerData.player;
            player.ws = ws;

            passcodeManager.delete(passcode); // prevent the code from being use again

            player.sendData(JSON.stringify({ type: 'joinAck', data: { id: player.id } }));
          }
          break;
        }
        // puts the player into the game and start playing
        case 'play': {
          const { name } = data;
          player.playerState = gameRooms[player.roomId].gameState.play(name, player.id);

          player.sendData(JSON.stringify({ type: 'playAck' }));
          break;
        }
        case 'syncReq':
          player.syncing = true;
          player.sendData(JSON.stringify({ type: 'syncAck', data: gameRooms[player.roomId].getSyncSnapshots() }));
          break;
        case 'syncAck2':
          player.syncing = false; // sync complete; can now send regular game snapshots to this player
          break;
        case 'controlInput': {
          if (!player.playerState)
            throw new Error(`Player ${player.id} attempting to send control input before initiating play packet`);

          // TODO: must validate these inputs are valid;
          const { movement, action } = data;
          player.playerState.insertControlInput(movement, action);
          break;
        }
        default:
          throw new Error(`Received invalid message type from client: ${type}`);
      }
    } catch (e) {
      // TODO: remove player from game room
      console.log(e);
      ws.close();
    }
  });

  ws.on('close', () => {
    // make sure player is still in the game room before removing
    if (player && gameRooms[player.roomId].players.get(player.id))
      gameRooms[player.roomId].removePlayer(player);
  });
});

const serverLoop = () => {
  setTimeout(serverLoop, configs.shared.tickInterval);

  debug.logGameTickRate(55);

  gameRooms.forEach((gameRoom) => {
    gameRoom.tick();

    const gameStateSnapshotPayload = {
      type: 'gameStateSnapshot',
      data: gameRoom.gameState.getSnapshot()
    };

    gameRoom.players.forEach((player) => {
      player.numInactiveTicks++;

      // remove inactive player
      if (player.numInactiveTicks > configs.server.inactiveTickLimit)
        gameRoom.removePlayer(player);
      // broadcast new game state data (if they are not currently syncing)
      else if (!player.syncing)
        player.sendData(JSON.stringify(gameStateSnapshotPayload));
    });
  });
};

serverLoop();
