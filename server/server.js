const express = require('express')
const WebSocket = require('ws')
const path = require('path')
const configs = require('../game-configs.json')
const Player = require('./models/player')

const PORT = process.env.PORT || configs.shared.port

const server = express()
  .use(express.static(path.join(__dirname, '../dist')))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

const wss = new WebSocket.Server({ server })

const players = {}

/*
class Player {
  constructor(name, ws, id) {
    this.id = id
    this.name = name
    this.position = {
      x: util.randomIntFromInterval(0, configs.shared.mapWidth),
      y: util.randomIntFromInterval(0, configs.shared.mapHeight)
    }
    this.isSyncingState = true // do not send gameState to this player when true
    this.websocket = ws

    this.snapshotQueueUnproc = [] // snapshotQueue data from client to be process at each gameTick
    this.snapshotQueueProc = [] // snapshotQueue data that has been processed and ready to be send to all other clients

    // prefill player's snapshotQueue with default by bufferSize
    for (let i = 0; i < configs.shared.tickBufferSize; i++) {
      this.snapshotQueueUnproc.push(defaultPlayerSnapshot)
    }
  }

  sendData(data) {
    if (this.websocket.readyState === WebSocket.OPEN)
      this.websocket.send(data)
  }
}*/

function updatePlayerLocation(player, direction) {
  if (direction.left)
    player.position.x -= configs.shared.playerSpeed

  if (direction.right)
    player.position.x += configs.shared.playerSpeed

  if (direction.up)
    player.position.y -= configs.shared.playerSpeed

  if (direction.down)
    player.position.y += configs.shared.playerSpeed
}

const isValidJoin = () => true
let currAvailablePlayerId = 0

const broadcastPlayerJoin = (player) => {
  const playerJoinData = JSON.stringify({
    type: 'playerJoin',
    data: {
      playerId: player.id,
      name: player.name
    }
  })

  Object.values(players).forEach(p => p.sendData(playerJoinData))
}

const getSyncData = () => {
  const syncData = []
  // position of every player along with its playerId
  Object.values(players).forEach((p) => {
    syncData.push({
      playerId: p.id,
      name: p.name,
      position: p.position
    })
  })

  return syncData
}

wss.on('connection', (ws) => {
  let player

  ws.on('message', (message) => {
    // TODO: implement try/catch logic to prevent server terminating
    // when payload is not valid JSON
    try {
      const payload = JSON.parse(message)

      if (payload.type === 'joinReq') {
        if (ws.readyState === WebSocket.OPEN && isValidJoin()) {
          player = new Player(payload.data /* this is the name of player */, ws, currAvailablePlayerId)
          players[currAvailablePlayerId] = player
          ws.send(JSON.stringify({
            type: 'joinAck',
            data: {
              playerId: currAvailablePlayerId,
              otherPlayersInGame: Object.values(players).map(p => ({ playerId: p.id, name: p.name }))
            }
          }))
          broadcastPlayerJoin(player)
          currAvailablePlayerId++
        } else {
          ws.send(JSON.stringify({ type: 'joinNack', data: 'reason: join failed...' }))
        }
      } else if (payload.type === 'syncReq') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'syncAck', data: getSyncData() }))
          player.isSyncingState = false
        }
      } else if (payload.type === 'playerState') {
        // TODO: check whether data is valid; going to be easier when its binary
        player.snapshotQueueUnproc.push(...payload.data)
      } else {
        console.log(`Received invalid message type from client: ${payload}`)
      }
    } catch (e) {
      console.log(e)
      ws.terminate()
      // TODO: remove player from players queue
      delete players[player.id]
    }
  })
})

function playersTick() {
  // Simulate tick logic for each player
  Object.values(players).forEach((player) => {
    player.playerMoveTick()
  })
}

const broadcastGameData = () => {
  const gameStateData = JSON.stringify(
    {
      type: 'gameState',
      data: Object.values(players).map(p => ({
        playerId: p.id,
        snapshots: p.snapshotQueueProc.splice(0, configs.shared.tickBufferSize)
      }))
    }
  )

  Object.values(players).forEach((player) => {
    // send gameState data to player when it's not in process of syncing
    if (!player.isSyncingState)
      player.sendData(gameStateData)
  })
}

let bufferCounter = 0

function gameTick() {
  // process movement data in snapshot queue for each player
  playersTick()

  // moveBullets()
  // checkBulletHits()

  // TODO
  // cleanPlayers() // players are remove from array when ws is disconnected
  // cleanBullets()
  bufferCounter++

  if (bufferCounter === configs.shared.tickBufferSize) {
    bufferCounter = 0
    broadcastGameData()
  }
}

// run game loop
setInterval(gameTick, configs.shared.tickInterval)
