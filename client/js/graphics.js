const configs = require('../../game-configs.json');
const global = require('./global');
const Coord = require('../../shared/models/coord');


const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const applyCtxSetting = (setting) => {
  Object.keys(setting).forEach((key) => {
    ctx[key] = setting[key];
  });
};

const drawCircle = (originCoord, radius, setting = {}) => {
  ctx.beginPath();

  applyCtxSetting(setting);

  ctx.arc(originCoord.x, originCoord.y, radius, 0, 2 * Math.PI, false);

  if (setting.fillStyle)
    ctx.fill();

  if (setting.strokeStyle)
    ctx.stroke();
};


const drawLine = (startCoord, endCoord, setting = {}) => {
  ctx.beginPath();

  applyCtxSetting(setting);

  ctx.moveTo(startCoord.x, startCoord.y);
  ctx.lineTo(endCoord.x, endCoord.y);

  ctx.stroke();
};

const drawRectangle = (coord, width, height, setting) => {
  ctx.beginPath();

  applyCtxSetting(setting);

  ctx.rect(coord.x, coord.y, width, height);

  if (setting.fillStyle)
    ctx.fill();

  if (setting.strokeStyle)
    ctx.stroke();
};

const drawText = (text, coord, maxWidth, setting) => {
  applyCtxSetting(setting);

  ctx.fillText(text, coord.x, coord.y, maxWidth);
};

const drawZoneBorders = () => {
  // draw vertical borders
  for (let i = 1; i < configs.shared.mapHeight / configs.shared.zoneHeight; ++i) {
    const startCoord = new Coord(0, i * configs.shared.zoneHeight);
    const endCoord = new Coord(configs.shared.mapHeight, i * configs.shared.zoneHeight);

    drawLine(startCoord, endCoord,
      { strokeStyle: configs.client.zoneBorderColor, lineWidth: configs.shared.zoneBorderSize }
    );
  }

  // draw horizontal borders
  for (let i = 1; i < configs.shared.mapWidth / configs.shared.zoneWidth; ++i) {
    const startCoord = new Coord(i * configs.shared.zoneWidth, 0);
    const endCoord = new Coord(i * configs.shared.zoneWidth, configs.shared.mapWidth);

    drawLine(startCoord, endCoord,
      { strokeStyle: configs.client.zoneBorderColor, lineWidth: configs.shared.zoneBorderSize }
    );
  }
};

const drawZone = (zone, width, height) => {
  const zoneColor = zone.status === 1 ? 'green' : 'brown';

  drawRectangle(zone.coord, width, height, { fillStyle: zoneColor });
};

const drawPlayer = (player, color) => {
  drawCircle(player.position,
    configs.shared.playerRadius,
    { fillStyle: color, strokeStyle: 'black', lineWidth: 1 }
  );
};

const drawPlayerName = (player) => {
  const maxWidth = 1000; // TODO: figure out max width of name
  const setting = {
    font: 'bold 1vw Impact',
    fillStyle: 'white',
    textAlign: 'center',
  };

  drawText(player.name,
    { x: player.position.x, y: player.position.y + 35 },
    maxWidth,
    setting);
};

const drawAttackRadius = (player) => {
  // color starts off at orange and becomes redder as it counts down rounded to nearest 1
  const greenIntensity = Math.round((255 * (player.actions.attack.countdown / configs.shared.attackCountdown)));
  const attackRadiusColor = `rgb(255, ${greenIntensity}, 0)`;

  drawCircle(player.position,
    configs.shared.attackRadius,
    { fillStyle: attackRadiusColor, strokeStyle: 'black', lineWidth: 1 }
  );
};

const renderLoop = () => {
  const gameState = global.get('gameState');
  const clientPlayer = global.get('clientPlayer');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  gameState.field.zones.forEach((zone) => {
    drawZone(zone, gameState.field.zoneWidth, gameState.field.zoneHeight);
  });

  drawZoneBorders();

  Object.values(gameState.players).forEach((player) => {
    if (player.actions.attack && !player.actions.attack.isCompleted()) {
      drawAttackRadius(player);
    }

    if (clientPlayer && player.id === clientPlayer.id)
      drawPlayer(player, configs.client.clientPlayerColor);
    else
      drawPlayer(player, configs.client.otherPlayersColor);
  });

  // draw names seperately to prevent players from blocking eachother's name
  Object.values(gameState.players).forEach((player) => {
    drawPlayerName(player);
  });

  requestAnimationFrame(renderLoop);
};

module.exports = {
  renderLoop
};
