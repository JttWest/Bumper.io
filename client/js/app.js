require('../css/app.css')
const configs = require('../../game-configs.json')
const key = require('./control').keyboardCodeMapping
const GameState = require('./models/game-state')
const debug = require('./debug')
const graphics = require('./graphics')
const global = require('./global')

const canvas = document.getElementById('canvas')

const keyRegister = {}

canvas.addEventListener('keydown', (e) => {
  keyRegister[e.keyCode] = true
})

canvas.addEventListener('keyup', (e) => {
  keyRegister[e.keyCode] = false
})

class Player {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.actions = {}
  }
}

let player

class PlayerSnapshot {
  // constructor() {
  //   this.movement = null
  //   this.action = null
  // }

  setAction(action) {
    this.action = action
  }

  setMovement(movement) {
    this.movement = movement
  }
}

let syncingGameState = false // drop all gameState packets from server when this is true
let joinedGame = false // gameTick only runs when this is true
let currPlayerId
let playerSnapshotQueue = []
let initGame = true // flag to begin render once first syncAck is received

const gameState = new GameState()

global.register('gameState', gameState)

const wsHost = window.location.hostname === 'localhost' ?
  `ws://localhost:${configs.shared.port}` :
  `ws://${window.location.host}`

const ws = new WebSocket(wsHost)

const sendSyncRequest = () => {
  syncingGameState = true

  const syncData = {
    type: 'syncReq'
  }

  ws.send(JSON.stringify(syncData))
}

const sendJoinRequest = () => {
  const joinData = {
    type: 'joinReq',
    data: 'placeholderName'
  }

  ws.send(JSON.stringify(joinData))
}

ws.onopen = () => {
  // Web Socket is connected, send data using send()
  sendJoinRequest()
}

const processGameSnapshots = (gameSnapshots) => {
  gameSnapshots.forEach((playerSnapshots) => {
    gameState.insertPlayerSnapshots(playerSnapshots.playerId, playerSnapshots.snapshots)

    // TODO: implement resync if deviation is too much
    // if (snapshotQueue.length > syncThreshold)
    //   requestResync
    const playerState = gameState.getPlayerState(playerSnapshots.playerId)
    // immediately process old snaphsots to ensure client game state is up to date
    if (playerState.snapshotQueue.length > configs.shared.tickBufferSize * 2) {
      playerState
        .processSnapshots(playerState.snapshotQueue.splice(0, playerState.snapshotQueue.length - (configs.shared.tickBufferSize * 2)))
    }
  })

  if (debug.isDebugMode()) {
    const currPlayerSnapshotQueueLength = gameState.getPlayerState(currPlayerId).snapshotQueue.length

    if (gameState.playerStates.some(p => p.snapshotQueue.length !== currPlayerSnapshotQueueLength)) {
      console.log('Mismatch snapshot length between players in gameState')
    }

    if (gameState.playerStates.some(p => p.snapshotQueue.length > configs.shared.tickBufferSize * 2)) {
      console.log('Snapshots for player exceed tickBufferSize * 2')
    }
  }
}

ws.onmessage = (evt) => {
  const payload = JSON.parse(evt.data)

  switch (payload.type) {
    case 'joinAck':
      joinedGame = true
      currPlayerId = payload.data.playerId

      // players in game before you joined
      payload.data.otherPlayersInGame.forEach((p) => {
        gameState.addNewPlayer(p)
      })

      console.log(`Joined game as player ${currPlayerId}`)
      break

    case 'joinNack':
      alert(payload.data /* reason for fail join*/)
      break

    case 'playerJoin':
      // new player has joined the game
      gameState.addNewPlayer(payload.data)
      break

    case 'syncAck':
      syncingGameState = false

      // TODO: update this to clear gameState
      payload.data.forEach((playerSyncData) => {
        gameState.updatePlayerPosition(playerSyncData.playerId, playerSyncData.position)
        gameState.insertPlayerSnapshots(playerSyncData.playerId, playerSyncData.bufferSnapshots)
      })

      // TODO: temp fix for now
      if (initGame) {
        const currentPlayerData = gameState.getPlayerState(currPlayerId)
        player = new Player(currentPlayerData.position.x, currentPlayerData.position.y)

        // is this the only place where player get assigned?
        global.register('player', player)

        // begin rendering game
        graphics.renderLoop()
        initGame = false
      }
      break

    case 'syncTrig':
      // TODO: implement this; still need??
      console.log('Default snapshot was used on server')
      break

    case 'gameState':
      // debug.logGameStatePacketReceiveRate(configs.shared.tickBufferSize * configs.shared.tickInterval + 50)

      // only take in game state if its not outdated
      if (!syncingGameState) {
        debug.logGameStatePacketReceiveRate(configs.shared.tickBufferSize * configs.shared.tickInterval + 50)
        processGameSnapshots(payload.data)
      }

      break

    default:
      console.log(`Invalid message received from server: ${payload}`)
  }
}

ws.onclose = () => {
  // websocket is closed.
  alert('socked connect to server closed')
}

const playerMoveTick = () => {
  const movementData = { left: false, right: false, up: false, down: false }

  if (keyRegister[key.W]) {
    player.y -= configs.shared.playerSpeed
    movementData.up = true
  }

  if (keyRegister[key.S]) {
    player.y += configs.shared.playerSpeed
    movementData.down = true
  }

  if (keyRegister[key.A]) {
    player.x -= configs.shared.playerSpeed
    movementData.left = true
  }

  if (keyRegister[key.D]) {
    player.x += configs.shared.playerSpeed
    movementData.right = true
  }

  return movementData
}

const playerActionTick = () => {
  // action in progress
  if (player.action) {
    if (player.action.countdown <= 0) {
      player.action = null
    } else if (player.action.type === 'attack') {
      player.action.countdown--
    }

    return
  }

  if (keyRegister[key.SPACE]) {
    const action = { type: 'attack', countdown: configs.shared.attackCountdown }
    player.action = action
    return action
  }

  return undefined
}

const updatePlayerState = (playerState) => {
  const snapshot = playerState.snapshotQueue.shift()

  if (!snapshot)
    return

  const movement = snapshot.movement
  const speed = configs.shared.playerSpeed

  if (movement.left)
    playerState.position.x -= speed

  if (movement.right)
    playerState.position.x += speed

  if (movement.up)
    playerState.position.y -= speed

  if (movement.down)
    playerState.position.y += speed
}

const sendPlayerState = (playerSnapshots) => {
  const playerStatePayload = {
    type: 'playerState',
    data: playerSnapshots
  }

  ws.send(JSON.stringify(playerStatePayload))
}

/*
Game Tick:
1 update current player state based on game control input
2 send playerState to server when playerSnapshotQueue reach tickBufferSize
3 update the game state using data from gameState
4 TODO: confirm player position using server game state server (and apply unchecked gameStates)
5 TODO: drop until last tickBufferSize in gameState[anyPlayer].snapshotQueue if deviate too much
*/
const gameTick = () => {
  debug.logGameTickRate(configs.shared.tickInterval + 10)

  setTimeout(gameTick, configs.shared.tickInterval)

  // game doesn't start until receiving joinAck from server
  if (!joinedGame)
    return

  debug.logEmptySnapshotQueueDuration(gameState.getPlayerState(currPlayerId).snapshotQueue.length)

  // lag occured -> resync client with server
  if (gameState.getPlayerState(currPlayerId).snapshotQueue.length === 0) {
    // request sync from server if haven't already
    if (!syncingGameState)
      sendSyncRequest()

    return
  }

  // (1) update player state based on movement and record player tick data
  const currPlayerSnapshot = new PlayerSnapshot()

  const movementData = playerMoveTick()
  currPlayerSnapshot.setMovement(movementData)

  const actionData = playerActionTick()
  currPlayerSnapshot.setAction(actionData)

  playerSnapshotQueue.push(currPlayerSnapshot)

  // (2) send playerState to server when ready
  if (playerSnapshotQueue.length === configs.shared.tickBufferSize) {
    sendPlayerState(playerSnapshotQueue)
    playerSnapshotQueue = []
  }

  // update the game state using data from gameSnapshotQueue
  if (gameState.getPlayerState(currPlayerId).snapshotQueue.length > 0) {
    gameState.playerStates.forEach(playerState => updatePlayerState(playerState))
  }
}

// run game loop
// setInterval(gameTick, configs.shared.tickInterval)
gameTick()

// const ctx = canvas.getContext('2d')
// const drawPlayer = (color, x, y) => {
//   ctx.beginPath()
//   ctx.fillStyle = color
//   ctx.strokeStyle = 'black'
//   ctx.rect(x, y, configs.shared.playerWidth, configs.shared.playerHeight)
//   ctx.lineWidth = 1
//   ctx.stroke()
//   ctx.fill()
// }

// const drawAttackRadius = (player) => {
//   // draw circle at player's position with radius from config
//   ctx.beginPath()
//   ctx.arc(player.x, player.y, configs.shared.attackRadius, 0, 2 * Math.PI, false)
//   ctx.fillStyle = 'orange'
//   ctx.fill()
// }

// const renderLoop = () => {
//   ctx.clearRect(0, 0, canvas.width, canvas.height)

//   // TODO: the player class should have a render method
//   gameState.playerStates.forEach((playerState) => {
//     const playerPos = playerState.position

//     drawPlayer(configs.client.otherPlayersColor, playerPos.x, playerPos.y)
//   })

//   if (player.action) {
//     if (player.action.type === 'attack')
//       drawAttackRadius(player)
//   }

//   drawPlayer(configs.client.playerColor, player.x, player.y)

//   requestAnimationFrame(renderLoop)
// }

/*
let mouseX
let mouseY

function mouseMove(e) {
  mouseX = e.offsetX
  mouseY = e.offsetY
}

function sendFireData(angle) {
  const fireBulletData = {
    type: 'fire',
    data: { angle }
  }

  ws.send(JSON.stringify(fireBulletData))
}

canvas.addEventListener('mousemove', mouseMove)
canvas.addEventListener('click', () => {
  const deltaX = mouseX - player.x
  const deltaY = mouseY - player.y
  const fireAngle = Math.atan2(deltaY, deltaX)
  sendFireData(fireAngle)
})*/
