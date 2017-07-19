const express = require('express')
const WebSocket = require('ws')
const path = require('path')
const configs = require('../game-configs.json')

const PORT = process.env.PORT || configs.shared.port

const server = express()
  .use(express.static(path.join(__dirname, '../dist')))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

const wss = new WebSocket.Server({ server })

const players = []

function Player(name, ws) {
  this.name = name
  this.position = { x: 395, y: 295 }
  this.ammo = 0
  this.movement = { left: false, right: false, up: false, down: false }
  this.isAlive = true
  this.health = 3
  this.websocket = ws
}

/*
Player object
postion: { x: number, y: number }
ammo: number
movement: { left: boolean, right: boolean, up: boolean, down: boolean }
isAlive: boolean
health: number
websocket: ws
size: { width: number, height: number }
*/

const bullets = []

function Bullet(originPosition, shootingAngle) {
  this.position = Object.assign({}, originPosition)
  this.velocity = { dx: Math.cos(shootingAngle), dy: Math.sin(shootingAngle) }
  this.lifeSpan = 10
}
/*
Bullet object
postion: {x: number, y: number}
targetPostion: {x: number, y: number}
lifeSpan: number
size: { width: number, height: number }
*/

/*
ws
onConnect: createPlayer(ws)
onDisconnect: removePlayer()
onMessage:
  fire: createBullet()
  move: updatePlayerLocation()
*/

// { left: boolean, right: boolean, up: boolean, down: boolean }
function updatePlayerLocation(player, direction) {
  const SPEED = 2

  if (direction.left)
    player.position.x -= SPEED

  if (direction.right)
    player.position.x += SPEED

  if (direction.up)
    player.position.y -= SPEED

  if (direction.down)
    player.position.y += SPEED
}

wss.on('connection', (ws) => {
  const player = new Player('name1', ws)
  players.push(player)

  ws.on('message', (message) => {
    // TODO: implement try/catch logic to prevent server terminating
    // when payload is not valid JSON
    try {
      const payload = JSON.parse(message)

      if (payload.type === 'move') {
        updatePlayerLocation(player, payload.data)
      } else if (payload.type === 'fire') {
        bullets.push(new Bullet(player.position, payload.data.angle))
      } else {
        console.log(`Received invalid message type from client: ${payload.type}`)
      }
    } catch (e) {
      console.log(e)
      ws.terminate()
      // TODO: remove player from players queue
    }
  })
})

function moveBullets() {
  // move bullets
  bullets.forEach((bullet) => {
    // TODO: use unit x and y distance
    bullet.position.x += bullet.velocity.dx * configs.shared.bulletSpeed
    bullet.position.y += bullet.velocity.dy * configs.shared.bulletSpeed

    bullet.lifeSpan--
  })
}

function rectanglesCollides(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

function checkBulletHits() {
  for (let i = players.length - 1; i >= 0; i--) {
    const player = players[i]

    for (let ii = bullets.length - 1; ii >= 0; ii--) {
      const bullet = bullets[ii]

      if (rectanglesCollides(player, bullet)) {
        if (player.health > 0)
          player.health--
      }
    }
  }
}

function cleanBullets() {
  // remove bullets with no lifeSpan left
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].lifeSpan <= 0)
      bullets.splice(i, 1)
  }
}

function gameLoop() {
  // this is driven by client instead (for now)
  // movePlayers()

  moveBullets()
  checkBulletHits()

  // TODO
  //cleanPlayers() // players are remove from array when ws is disconnected
  //cleanBullets()
}

// run game loop
setInterval(gameLoop, configs.shared.gameTickInterval)

function broadcastGameData() {
  // let playersData

  players.forEach((player, i) => {
    if (player.websocket.readyState === WebSocket.OPEN) {
      player.websocket.send(
        JSON.stringify(
          {
            player: player.position,
            bullets,
            otherPlayers: players
              .filter((p, ii) => i !== ii) // remove current player from other player array
              .map(p => p.position)
          }
        ))
    }
  })
}

// broadcast game data
setInterval(broadcastGameData, 100)
