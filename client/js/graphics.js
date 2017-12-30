const configs = require('../../app-configs');
const global = require('./global');
const Coord = require('../../shared/models/coord');
const zoneStatus = require('../../shared/enums').shared.zoneStatus;

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
      { strokeStyle: configs.client.zone.borderColor, lineWidth: configs.client.zone.borderSize }
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
  let zoneColor;

  switch (zone.status) {
    case zoneStatus.ON:
      zoneColor = configs.client.zone.onColor;
      break;
    case zoneStatus.OFF:
      zoneColor = configs.client.zone.offColor;
      break;
    case zoneStatus.TRANSITION:
      zoneColor = configs.client.zone.transitionColor;
      break;
    default:
      throw new Error(`Invalid zone status: ${zone.status}`);
  }

  drawRectangle(zone.coord, width, height, { fillStyle: zoneColor });
};


// testing for client prediction
/*
playerId
position
delay
*/
const pastPlayerPostion = {};

const drawPastPlayerPostion = (player, delay) => {
  if (!pastPlayerPostion[player.id]) {
    pastPlayerPostion[player.id] = { positions: [Object.assign({}, player.position)], delayCount: 1 };
  } else if (pastPlayerPostion[player.id].delayCount < delay) {
    pastPlayerPostion[player.id].positions.push(Object.assign({}, player.position));
    pastPlayerPostion[player.id].delayCount++;
  } else {
    pastPlayerPostion[player.id].positions.push(Object.assign({}, player.position));

    drawCircle(pastPlayerPostion[player.id].positions.shift(),
      configs.shared.playerRadius,
      { strokeStyle: 'black', lineWidth: 1 }
    );
  }
};


const drawPlayer = (player, color) => {
  // drawPastPlayerPostion(player, 4);

  drawCircle(player.position,
    configs.shared.playerRadius,
    { fillStyle: color, strokeStyle: 'black', lineWidth: 1 }
  );
};

const drawPlayerName = (player) => {
  const maxWidth = 1000; // TODO: figure out max width of name
  const setting = {
    font: 'bold 15px Impact',
    fillStyle: 'white',
    textAlign: 'center',
  };

  drawText(player.name,
    new Coord(player.position.x, player.position.y + 35),
    maxWidth,
    setting);
};

const render = (clientPlayerId, gameSnapshot) => {
  // const gameSnapshot = global.get('gameState');

  if (gameSnapshot) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gameSnapshot.field.zones.forEach((zone) => {
      drawZone(zone, configs.shared.zoneWidth, configs.shared.zoneHeight);
    });

    drawZoneBorders();

    gameSnapshot.players.forEach((player) => {
      if (player.id === clientPlayerId)
        drawPlayer(player, configs.client.clientPlayerColor);
      else
        drawPlayer(player, configs.client.otherPlayersColor);
    });

    // draw names seperately to prevent players from blocking eachother's name
    gameSnapshot.players.forEach((player) => {
      drawPlayerName(player);
    });
  }
};

module.exports = {
  render
};
