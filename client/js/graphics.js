const configs = require('../../game-configs.json')
const global = require('./global')
const Coord = require('./models/coord')


const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const drawLine = (startCoord, endCoord, color, lineWidth) => {
  ctx.beginPath()

  ctx.lineWidth = lineWidth
  ctx.strokeStyle = color

  ctx.moveTo(startCoord.x, startCoord.y)
  ctx.lineTo(endCoord.x, endCoord.y)


  ctx.stroke()
}

const drawZoneBorders = () => {
  // draw vertical borders
  for (let i = 1; i < configs.shared.mapHeight / configs.shared.zoneHeight; ++i) {
    const startCoord = new Coord(0, i * configs.shared.zoneHeight)
    const endCoord = new Coord(configs.shared.mapHeight, i * configs.shared.zoneHeight)

    drawLine(startCoord, endCoord, configs.client.zoneBorderColor, configs.shared.zoneBorderSize)
  }

  // draw horizontal borders
  for (let i = 1; i < configs.shared.mapWidth / configs.shared.zoneWidth; ++i) {
    const startCoord = new Coord(i * configs.shared.zoneWidth, 0)
    const endCoord = new Coord(i * configs.shared.zoneWidth, configs.shared.mapWidth)

    drawLine(startCoord, endCoord, configs.client.zoneBorderColor, configs.shared.zoneBorderSize)
  }
}

const drawPlayer = (color, x, y) => {
  ctx.beginPath()

  ctx.fillStyle = color

  ctx.lineWidth = 10
  ctx.strokeStyle = 'black'

  ctx.arc(x, y, configs.shared.playerRadius, 0, 2 * Math.PI, false)

  // ctx.rect(x - (configs.shared.playerWidth / 2),
  //          y - (configs.shared.playerHeight / 2),
  //          configs.shared.playerWidth,
  //          configs.shared.playerHeight)

  ctx.stroke()
  ctx.fill()
}

const drawAttackRadius = (player) => {
  // draw circle at player's position with radius from config
  ctx.beginPath()
  ctx.arc(player.x, player.y, configs.shared.attackRadius, 0, 2 * Math.PI, false)

  // color starts off at orange and becomes redder as it counts down rounded to nearest 1
  const greenIntensity = Math.round((255 * (player.action.countdown / configs.shared.attackCountdown)))
  const attackRadiusColor = `rgb(255, ${greenIntensity}, 0)`

  ctx.fillStyle = attackRadiusColor
  ctx.fill()
}

const renderLoop = () => {
  const player = global.get('player')
  const gameState = global.get('gameState')

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  drawZoneBorders()

  // TODO: the player class should have a render method
  gameState.playerStates.forEach((playerState) => {
    const playerPos = playerState.position

    drawPlayer(configs.client.otherPlayersColor, playerPos.x, playerPos.y)
  })

  if (player.action) {
    if (player.action.type === 'attack')
      drawAttackRadius(player)
  }

  drawPlayer(configs.client.playerColor, player.x, player.y)

  requestAnimationFrame(renderLoop)
}

module.exports = {
  renderLoop
}
