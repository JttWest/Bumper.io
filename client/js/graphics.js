const configs = require('../../app-configs');
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
  /*
  let greenIntensity;

  if (zone.isTransitioning() && zone.statusTransition.countdown > 0)
    // min 25 intensity for clarity between on/off
    greenIntensity = Math.round((100 * (zone.statusTransition.countdown / configs.shared.zoneTransitionCountdown))) + 25;
  else
    greenIntensity = zone.isOn() ? '0' : '125'; // lime is rgb(0.255.0)

  const zoneColor = `rgb(0, ${greenIntensity}, 0)`;
  */

  const zoneColor = zone.status === 'ON' ? 'rgb(0, 0, 0)' : 'rgb(0, 125, 0)';

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

const renderLoop = (clientPlayerId) => {
  const gameState = global.get('gameState');
  // const clientPlayer = global.get('clientPlayer');

  if (gameState) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gameState.field.zones.forEach((zone) => {
      drawZone(zone, configs.shared.zoneWidth, configs.shared.zoneHeight);
    });

    drawZoneBorders();

    gameState.players.forEach((player) => {
      if (clientPlayerId && player.id === clientPlayerId)
        drawPlayer(player, configs.client.clientPlayerColor);
      else
        drawPlayer(player, configs.client.otherPlayersColor);
    });

    // draw names seperately to prevent players from blocking eachother's name
    gameState.players.forEach((player) => {
      drawPlayerName(player);
    });
  }

  if (global.getAppStatus() === 'PLAYING' || global.getAppStatus() === 'STANDBY')
    requestAnimationFrame(() => renderLoop(clientPlayerId));
};

module.exports = {
  renderLoop
};
