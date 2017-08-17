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

const isValidJoin = () => true
let currAvailablePlayerId = 0

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

const broadcastPlayerJoin = (player) => {
  const playerJoinData = JSON.stringify({
    type: 'playerJoin',
    data: {
      name: player.name,
      playerId: player.id,
      position: player.position
    }
  })

  Object.values(players).forEach(p => p.sendData(playerJoinData))
}

wss.on('connection', (ws) => {
  let player

  ws.on('message', (message) => {
    // TODO: implement try/catch logic to prevent server terminating
    // when payload is not valid JSON
    try {
      const payload = JSON.parse(message)

      switch (payload.type) {
        case 'joinReq':
          if (ws.readyState === WebSocket.OPEN && isValidJoin()) {
            player = new Player(payload.data /* this is the name of player */, ws, currAvailablePlayerId)

            // broadcast before adding new player to players list to prevent sending 'playerJoin' to joining player
            broadcastPlayerJoin(player)

            players[currAvailablePlayerId] = player

            ws.send(JSON.stringify({
              type: 'joinAck',
              data: {
                playerId: currAvailablePlayerId,
                otherPlayersInGame: Object.values(players).map(p => ({ playerId: p.id, name: p.name }))
              }
            }))

            currAvailablePlayerId++
          } else {
            ws.send(JSON.stringify({ type: 'joinNack', data: 'reason: join failed...' }))
          }
          break

        case 'syncReq':
          player.sendData(JSON.stringify({ type: 'syncAck', data: getSyncData() }))
          player.isSyncingState = false
          break

        case 'playerState':
          // TODO: check whether data is valid; going to be easier when its binary
          player.snapshotQueueUnproc.push(...payload.data)
          break

        default:
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
    // TODO: use isSyncingState here

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

  // TODO
  // cleanPlayers() // players are remove from array when ws is disconnected
  bufferCounter++

  if (bufferCounter === configs.shared.tickBufferSize) {
    bufferCounter = 0
    broadcastGameData()
  }
}

// run game loop
setInterval(gameTick, configs.shared.tickInterval)
