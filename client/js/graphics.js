const configs = require('../../game-configs.json')
const global = require('./global')
const Coord = require('./models/coord')


const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const applyCtxSetting = (setting) => {
  Object.keys(setting).forEach((key) => {
    ctx[key] = setting[key]
  })
}

const drawCircle = (originCoord, radius, setting = {}) => {
  ctx.beginPath()

  applyCtxSetting(setting)

  ctx.arc(originCoord.x, originCoord.y, radius, 0, 2 * Math.PI, false)

  ctx.stroke()

  if (setting.fillStyle)
    ctx.fill()
}


const drawLine = (startCoord, endCoord, setting = {}) => {
  ctx.beginPath()

  applyCtxSetting(setting)

  ctx.moveTo(startCoord.x, startCoord.y)
  ctx.lineTo(endCoord.x, endCoord.y)

  ctx.stroke()
}

const drawRectangle = (originCoord, width, height, setting) => {
  ctx.beginPath()

  applyCtxSetting(setting)

  ctx.rect(originCoord.x, originCoord.y, width, height)

  ctx.stroke()
}

const drawZoneBorders = () => {
  // draw vertical borders
  for (let i = 1; i < configs.shared.mapHeight / configs.shared.zoneHeight; ++i) {
    const startCoord = new Coord(0, i * configs.shared.zoneHeight)
    const endCoord = new Coord(configs.shared.mapHeight, i * configs.shared.zoneHeight)

    drawLine(startCoord, endCoord,
      { strokeStyle: configs.client.zoneBorderColor, lineWidth: configs.shared.zoneBorderSize }
    )
  }

  // draw horizontal borders
  for (let i = 1; i < configs.shared.mapWidth / configs.shared.zoneWidth; ++i) {
    const startCoord = new Coord(i * configs.shared.zoneWidth, 0)
    const endCoord = new Coord(i * configs.shared.zoneWidth, configs.shared.mapWidth)

    drawLine(startCoord, endCoord,
      { strokeStyle: configs.client.zoneBorderColor, lineWidth: configs.shared.zoneBorderSize }
    )
  }
}

const drawPlayer = (color, x, y) => {
  drawCircle({ x, y },
    configs.shared.playerRadius,
    { fillStyle: color, lineWidth: 5, strokeStyle: 'black' }
  )
}

const drawAttackRadius = (player) => {
  // color starts off at orange and becomes redder as it counts down rounded to nearest 1
  const greenIntensity = Math.round((255 * (player.action.countdown / configs.shared.attackCountdown)))
  const attackRadiusColor = `rgb(255, ${greenIntensity}, 0)`

  drawCircle({ x: player.x, y: player.y },
    configs.shared.attackRadius,
    { fillStyle: attackRadiusColor }
  )
}

const renderLoop = () => {
  const player = global.get('player')
  const gameState = global.get('gameState')

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  drawZoneBorders()

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
