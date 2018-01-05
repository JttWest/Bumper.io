const configs = require('../../app-configs');
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
  ctx.save();

  ctx.beginPath();
  applyCtxSetting(setting);

  ctx.arc(originCoord.x, originCoord.y, radius, 0, 2 * Math.PI, false);

  if (setting.fillStyle)
    ctx.fill();

  if (setting.strokeStyle)
    ctx.stroke();

  ctx.restore();
};


const drawLine = (startCoord, endCoord, setting = {}) => {
  ctx.save();

  ctx.beginPath();

  applyCtxSetting(setting);

  ctx.moveTo(startCoord.x, startCoord.y);
  ctx.lineTo(endCoord.x, endCoord.y);

  ctx.stroke();

  ctx.restore();
};

const drawRectangle = (coord, width, height, setting) => {
  ctx.save();

  ctx.beginPath();

  applyCtxSetting(setting);

  ctx.rect(coord.x, coord.y, width, height);

  if (setting.fillStyle)
    ctx.fill();

  if (setting.strokeStyle)
    ctx.stroke();

  ctx.restore();
};

const drawText = (text, coord, maxWidth, setting) => {
  ctx.save();

  applyCtxSetting(setting);

  ctx.fillText(text, coord.x, coord.y, maxWidth);

  ctx.restore();
};

const drawZoneBorders = () => {
  // draw horizontal borders
  for (let i = 1; i < configs.shared.mapHeight / configs.shared.zoneHeight; ++i) {
    const startCoord = new Coord(0, i * configs.shared.zoneHeight);
    const endCoord = new Coord(configs.shared.mapWidth, i * configs.shared.zoneHeight);

    drawLine(startCoord, endCoord,
      { strokeStyle: configs.client.zone.borderColor, lineWidth: configs.client.zone.borderSize }
    );
  }

  // draw vertical borders
  for (let i = 1; i < configs.shared.mapWidth / configs.shared.zoneWidth; ++i) {
    const startCoord = new Coord(i * configs.shared.zoneWidth, 0);
    const endCoord = new Coord(i * configs.shared.zoneWidth, configs.shared.mapHeight);

    drawLine(startCoord, endCoord,
      { strokeStyle: configs.client.zoneBorderColor, lineWidth: configs.shared.zoneBorderSize }
    );
  }
};

/* TODO: Reconsider whether these zone heplers should be here */
const numZonesH = configs.shared.mapWidth / configs.shared.zoneWidth;

const getZoneCoordByIndex = (index) => {
  const rowIndex = Math.floor(index / numZonesH);
  const colIndex = index % numZonesH;

  return new Coord(colIndex * configs.shared.zoneWidth, rowIndex * configs.shared.zoneHeight);
};

const drawZone = (zone, index) => {
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

  drawRectangle(getZoneCoordByIndex(index),
    configs.shared.zoneWidth,
    configs.shared.zoneHeight,
    { fillStyle: zoneColor });
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
  const ctxSetting = { fillStyle: color, strokeStyle: 'black', lineWidth: 1 };

  if (player.status.unmaterialized)
    ctxSetting.globalAlpha = configs.client.player.unmaterializedTransparency;

  drawCircle(player.position,
    configs.shared.playerRadius,
    ctxSetting
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
  if (gameSnapshot) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gameSnapshot.field.zones.forEach((zone, index) => {
      drawZone(zone, index);
    });

    drawZoneBorders();

    let clientPlayer;

    gameSnapshot.players.forEach((player) => {
      if (player.id === clientPlayerId)
        clientPlayer = player;
      else
        drawPlayer(player, configs.client.player.otherColor);
    });

    // draw client player last so it will appear on top of other players
    if (clientPlayer)
      drawPlayer(clientPlayer, configs.client.player.clientColor);

    // draw names seperately to prevent players from blocking eachother's name
    // gameSnapshot.players.forEach((player) => {
    //   drawPlayerName(player);
    // });
  }
};

module.exports = {
  render
};
