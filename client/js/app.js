require('../css/app.css')
const configs = require('../../game-configs.json')

class Player {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.h = configs.shared.playerHeight
    this.w = configs.shared.playerWidth
  }
}
const player = new Player(395, 295)

let movementQueue = []

// const ws = new WebSocket('ws://localhost:3000')
const wsHost = window.location.hostname === 'localhost' ?
  `ws://localhost:${configs.shared.port}` :
  `ws://${window.location.host}`

const ws = new WebSocket(wsHost)

let bullets = []
let otherPlayers = []

ws.onopen = () => {
  // Web Socket is connected, send data using send()
}

ws.onmessage = (evt) => {
  const payload = JSON.parse(evt.data)

  //player.x = payload.player.x
  //player.y = payload.player.y

  bullets = payload.bullets

  otherPlayers = payload.otherPlayers
}

ws.onclose = function () {
  // websocket is closed.
}

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const keys = {}

canvas.addEventListener('keydown', (e) => {
  keys[e.keyCode] = true
})

canvas.addEventListener('keyup', (e) => {
  keys[e.keyCode] = false
})

const sendMoveData = () => {
  const movementData = {
    type: 'move',
    data: movementQueue
  }

  movementQueue = []

  ws.send(JSON.stringify(movementData))
}

setInterval(sendMoveData, configs.client.clientPacketInterval)

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

function mainDraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  otherPlayers.forEach((p) => {
    drawPlayer(configs.client.otherPlayersColor, p.x, p.y)
  })

  bulletsDraw()

  drawPlayer(configs.client.playerColor, player.x, player.y)

  requestAnimationFrame(mainDraw)
}

mainDraw()

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
})

const playerMoveTick = () => {
  // do nothing if movementQueue is full
  if (movementQueue.length >= (configs.client.clientPacketInterval / configs.shared.gameTickInterval))
    console.log('Movement Queue exceeded intended size')

  const movementData = { left: false, right: false, up: false, down: false }

  if (keys[87]) {
    player.y -= configs.shared.playerSpeed
    movementData.up = true
  }

  if (keys[83]) {
    player.y += configs.shared.playerSpeed
    movementData.down = true
  }

  if (keys[65]) {
    player.x -= configs.shared.playerSpeed
    movementData.left = true
  }

  if (keys[68]) {
    player.x += configs.shared.playerSpeed
    movementData.right = true
  }

  movementQueue.push(movementData)
}

function gameTick() {
  // move player and put movement into queue to be send to server
  playerMoveTick()


}

// run game loop
setInterval(gameTick, configs.shared.gameTickInterval)

/*
window.onload = function () {
  // ---------------- init -------------------------------------- //
  // canvas init
  let canvas = document.getElementById('canvas')
  canvas.width = 800
  canvas.height = 600
  let c = canvas.getContext('2d')
  let WIDTH = canvas.width
  let HEIGHT = canvas.height

  // key press init
  let keys = []

  // player init
  let player1 = new Player(395, 295, 10, 10)

  // bullet init
  let deltaX = 0
  let deltaY = 0
  let rotation = 0
  let xtarget = 0
  let ytarget = 0
  let theBullets = []

  // bad guy init
  let theBadGuys = []
  let spawnX
  let spawnY

  let mouseX
  let mouseY

  // ---------------- end init --------------------------------- //

  function mainDraw() {
    c.clearRect(0, 0, WIDTH, HEIGHT)

    c.beginPath()
    c.fillStyle = 'red'
    c.strokeStyle = 'blue'
    c.rect(player1.x, player1.y, player1.w, player1.h)
    c.lineWidth = 1
    c.stroke()
    c.fill()

    playerMove()

    badGuysMove()
    badGuysDraw()

    bulletsMove()
    bulletsDraw()

    checkBulletHits()

    if (Math.random() * 100 < 3) {
      pushBadGuy()
    }

    removeOutOfBoundBullets()

    requestAnimationFrame(mainDraw)
  }

  mainDraw()

  canvas.addEventListener('keydown', (e) => {
    keys[e.keyCode] = true
  })

  canvas.addEventListener('keyup', (e) => {
    keys[e.keyCode] = false
  })

  function playerMove(e) {
    if (keys[87]) {
      player1.y -= 2
    }
    if (keys[83]) {
      player1.y += 2
    }
    if (keys[65]) {
      player1.x -= 2
    }
    if (keys[68]) {
      player1.x += 2
    }
    return false
  }

  function mouseMove(e) {
    mouseX = e.offsetX
    mouseY = e.offsetY
  }

  canvas.addEventListener('mousemove', mouseMove)
  canvas.addEventListener('click', () => {
    createBullet(mouseX, mouseY, player1.x, player1.y)
  })

  function createBullet(targetX, targetY, shooterX, shooterY) {
    deltaX = targetX - shooterX
    deltaY = targetY - shooterY
    rotation = Math.atan2(deltaY, deltaX)
    xtarget = Math.cos(rotation)
    ytarget = Math.sin(rotation)

    theBullets.push({
      active: true,
      x: shooterX,
      y: shooterY,
      speed: 10,
      xtarget,
      ytarget,
      w: 3,
      h: 3,
      color: 'black',
      angle: rotation
    })
  }

  function bulletsMove() {
    theBullets.forEach((i) => {
      i.x += i.xtarget * i.speed
      i.y += i.ytarget * i.speed
    })
  }

  function bulletsDraw() {
    theBullets.forEach((i) => {
      c.beginPath()
      c.fillStyle = 'black'
      c.rect(i.x, i.y, i.w, i.h)
      c.fill()
    })
  }

  function removeOutOfBoundBullets() {
    for (let i = 0; i < theBullets.length; ++i) {
      let bullet = theBullets[i]

      if (bullet.x > WIDTH || bullet.x < 0 || bullet.y < 0 || bullet.y > HEIGHT)
        theBullets.splice(i, 1)
    }
  }

  function pushBadGuy() {
    if (Math.random() < 0.5) {
      spawnX = Math.random() < 0.5 ? -11 : 801
      spawnY = Math.random() * 600
    } else {
      spawnX = Math.random() * 800
      spawnY = Math.random() < 0.5 ? -11 : 601
    }

    theBadGuys.push({
      x: spawnX, y: spawnY, w: 10, h: 10, speed: Math.random()
    })
  }

  function badGuysMove() {
    theBadGuys.forEach((i, j) => {
      if (i.x > player1.x) { i.x -= i.speed }
      if (i.x < player1.x) { i.x += i.speed }
      if (i.y > player1.y) { i.y -= i.speed }
      if (i.y < player1.y) { i.y += i.speed }
    })
  }

  function badGuysDraw() {
    theBadGuys.forEach((i, j) => {
      c.beginPath()
      c.fillStyle = 'blue'
      c.strokeStyle = 'red'
      c.rect(i.x, i.y, i.w, i.h)
      c.lineWidth = 1
      c.stroke()
      c.fill()
    })
  }

  function collides(a, b) {
    return a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
  }

  function checkBulletHits() {
    if (theBullets.length > 0 && theBadGuys.length > 0) {
      for (let j = theBullets.length - 1; j >= 0; j--) {
        for (let k = theBadGuys.length - 1; k >= 0; k--) {
          if (collides(theBadGuys[k], theBullets[j])) {
            theBadGuys.splice(k, 1)
          }
        }
      }
    }
  }
}
*/
