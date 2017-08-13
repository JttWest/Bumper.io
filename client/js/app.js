require('../css/app.css')
const configs = require('../../game-configs.json')
const key = require('./control').keyboardCodeMapping
const GameState = require('./models/game-state')

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

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
    this.h = configs.shared.playerHeight
    this.w = configs.shared.playerWidth
  }
}

let player // = new Player(395, 295)

class PlayerSnapshot {
  constructor(movement) {
    this.movement = movement
  }

  setFireAction(shotAngle) {
    this.action = {
      actionType: 'fire',
      angle: shotAngle
    }
  }
}

let syncingGameState = false // drop all gameState packets from server when this is true
let joinedGame = false // gameTick only runs when this is true
let currPlayerId
let playerSnapshotQueue = []
let initGame = true // flag to begin render once first syncAck is received

let bullets = [] // TODO: what is this for??
let snapshotsInQueue = 0 // number of snapshots in game state snapshotQueue for every other individual player right now

// const gameState = {
//   // id: {
//   //   name: string,
//   //   position: {x: number, y: number},
//   //   snapshotQueue: [playerSnapshot]
//   // }
// }

const gameState = new GameState()

function GameStateEntry(name) {
  this.name = name
  this.position = null
  this.snapshotQueue = []
}

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

const processGameState = (gameSnapshots) => {
  gameSnapshots.forEach((playerState) => {
    gameState.insertPlayerSnapshots(playerState.playerId, playerState.snapshots)
  })

  snapshotsInQueue += configs.shared.tickBufferSize
}

ws.onmessage = (evt) => {
  const payload = JSON.parse(evt.data)

  // TODO: make these switch cases
  if (payload.type === 'joinAck') {
    joinedGame = true
    currPlayerId = payload.data.playerId

    // players in game before you joined
    payload.data.otherPlayersInGame.forEach((p) => {
      gameState.addNewPlayer(p.playerId, p.name)
    })

    console.log(`Joined game as player ${currPlayerId}`)
  } else if (payload.type === 'joinNack') {
    alert(payload.data /* reason for fail join*/)
  } else if (payload.type === 'playerJoin') {
    // new player has joined the game
    gameState.addNewPlayer(payload.data.playerId, payload.data.name)
  } else if (payload.type === 'syncAck') {
    syncingGameState = false

    payload.data.forEach((playerSyncData) => {
      gameState.updatePlayerPosition(playerSyncData.playerId, playerSyncData.position)
    })

    // TODO: temp fix for now
    if (initGame) {
      const currentPlayerData = gameState.getPlayerState(currPlayerId)
      player = new Player(currentPlayerData.position.x, currentPlayerData.position.y)

      // begin rendering game
      renderLoop()
      initGame = false
    }
  } else if (payload.type === 'gameState') {
    // only take in game state if its not outdated
    if (!syncingGameState)
      processGameState(payload.data)
  } else {
    cosnole.log(`Invalid message received from server: ${payload}`)
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

const updatePlayerState = (playerState) => {
  const movement = playerState.snapshotQueue.shift().movement
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
5 TODO: drop until last 5 in gameState[anyPlayer].snapshotQueue if deviate too much
*/
const gameTick = () => {
  // game doesn't start until receiving joinAck from server
  if (!joinedGame)
    return

  // lag occured -> resync client with server
  if (snapshotsInQueue === 0) {
    // request sync from server if haven't already
    if (!syncingGameState)
      sendSyncRequest()

    return
  }

  // (1) update player state based on movement and record player tick data
  const movementData = playerMoveTick()
  const currPlayerSnapshot = new PlayerSnapshot(movementData)
  playerSnapshotQueue.push(currPlayerSnapshot)

  // (2) send playerState to server when ready
  if (playerSnapshotQueue.length === configs.shared.tickBufferSize) {
    sendPlayerState(playerSnapshotQueue)
    playerSnapshotQueue = []
  }

  // update the game state using data from gameSnapshotQueue
  if (snapshotsInQueue > 0) {
    gameState.playerStates.forEach(playerState => updatePlayerState(playerState))
    snapshotsInQueue--
  }
}

function bulletsDraw() {
  bullets.forEach((b) => {
    ctx.beginPath()
    ctx.fillStyle = configs.client.bulletColor
    ctx.rect(b.position.x, b.position.y, 5, 5)
    ctx.fill()
  })
}

function drawPlayer(color, x, y) {
  ctx.beginPath()
  ctx.fillStyle = color
  ctx.strokeStyle = 'black'
  ctx.rect(x, y, player.w, player.h)
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fill()
}

function renderLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  gameState.playerStates.forEach((playerState) => {
    const playerPos = playerState.position

    // temp fix:
    if (playerPos)
      drawPlayer(configs.client.otherPlayersColor, playerPos.x, playerPos.y)
  })

  // bulletsDraw()

  drawPlayer(configs.client.playerColor, player.x, player.y)

  requestAnimationFrame(renderLoop)
}

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

// run game loop
setInterval(gameTick, configs.shared.tickInterval)
