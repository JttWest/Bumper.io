const configs = require('../../game-configs.json')
const global = require('./global')
const Coord = require('../../shared/models/coord')


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

  if (setting.fillStyle)
    ctx.fill()

  if (setting.strokeStyle)
    ctx.stroke()
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

  if (setting.fillStyle)
    ctx.fill()

  if (setting.strokeStyle)
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

const drawZone = (zone, width, height) => {
  const zoneColor = zone.status === 1 ? 'green' : 'brown'

  drawRectangle(zone.coord, width, height, { fillStyle: zoneColor })
}

const drawPlayer = (player, color) => {
  drawCircle(player.position,
    configs.shared.playerRadius,
    { fillStyle: color, strokeStyle: 'black', lineWidth: 1 }
  )
}

const drawAttackRadius = (player) => {
  // color starts off at orange and becomes redder as it counts down rounded to nearest 1
  const greenIntensity = Math.round((255 * (player.action.countdown / configs.shared.attackCountdown)))
  const attackRadiusColor = `rgb(255, ${greenIntensity}, 0)`

  drawCircle(player.position,
    configs.shared.attackRadius,
    { fillStyle: attackRadiusColor, strokeStyle: 'black', lineWidth: 1 }
  )
}

const renderLoop = () => {
  const gameState = global.get('gameState')

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  gameState.field.zones.forEach((zone) => {
    drawZone(zone, gameState.field.zoneWidth, gameState.field.zoneHeight)
  })

  drawZoneBorders()

  Object.values(gameState.players).forEach((player) => {
    if (player.action && player.action.type === 'attack') {
      drawAttackRadius(player)
    }

    drawPlayer(player, configs.client.otherPlayersColor)
  })

  requestAnimationFrame(renderLoop)
}

module.exports = {
  renderLoop
}
