const util = require('../../shared/util');
const configs = require('../../app-configs').shared;
const Coord = require('../../shared/models/coord');

const minBotMovementRepeat = 5;
const maxBotMovementRepeast = 50;

const isCloseToBorder = (coord) => {
  const buffer = 30;

  if (coord.x < buffer || coord.x > configs.mapWidth - buffer ||
    coord.y < buffer || coord.y > configs.mapHeight - buffer)
    return true;

  return false;
};

const isInDangerZone = (field, position) => {
  const zone = field.getZoneByCoord(position);

  if (!zone)
    return false;

  return !zone.isOff();
};

const isMovingIntoDangerZone = (field, currPos, direction, scanDist) => {
  const xDisplacement = scanDist * Math.cos(direction);
  const yDisplacement = scanDist * Math.sin(direction);

  const newPos = new Coord(currPos.x + xDisplacement, currPos.y + yDisplacement);

  const zone = field.getZoneByCoord(newPos);

  if (!zone || zone.isOff())
    return false;

  return true;
};

const getAngleBetweenCoords = (originCoord, targetCoord) => {
  const deltaX = targetCoord.x - originCoord.x;
  const deltaY = targetCoord.y - originCoord.y;

  return Math.atan2(deltaY, deltaX);
};

const getTargetDistance = (playerCoord, targetCoord) => {
  const dx = playerCoord.x - targetCoord.x;
  const dy = playerCoord.y - targetCoord.y;

  return Math.sqrt((dx * dx) + (dy * dy));
};

const generateDashTowardTargetSnapshot = (player, target) => {
  const movement = getAngleBetweenCoords(player.position, target.position);
  const action = 'dash';

  return { movement, action };
};

const generateMoveTowardTargetSnapshot = (player, target) => {
  const movement = getAngleBetweenCoords(player.position, target.position);
  return { movement };
};

const getClosestPlayer = (player, gameState) => {
  let closestPlayer;
  let distance = Number.POSITIVE_INFINITY;

  Object.values(gameState.players).forEach((p) => {
    // skip current player during check
    if (player.id === p.id)
      return;

    const currDist = getTargetDistance(player.position, p.position);
    if (currDist < distance)
      closestPlayer = p;
  });

  return closestPlayer;
};

const dashClosest = (player, gameState) => {
  // look at gameState players and check how far away they are
  // pick first player in range for now
  const closestPlayer = getClosestPlayer(player, gameState);

  // only player in game
  if (!closestPlayer)
    return;

  const snapshot = generateDashTowardTargetSnapshot(player, closestPlayer);
  player.insertControlInput(snapshot.movement, snapshot.action);
};

class BotPlayer {
  constructor(id, playerState, gameState) {
    this.id = id;
    this.playerState = playerState;
    this.movement = {
      direction: null,
      movementRepeatCount: 0
    };

    this.gameState = gameState;
    this.intention = null;
  }

  isKilled() {
    return this.playerState.isKilled && !this.gameState.players[this.id];
  }

  tick() {
    const chance = Math.random();

    if (chance < 0.01) {
      // only dash when attacking
      dashClosest(this.playerState, this.gameState);
    } else {
      if (this.movement.movementRepeatCount <= 0) {
        this.movement.movementRepeatCount = util.randomIntFromInterval(minBotMovementRepeat, maxBotMovementRepeast);

        this.movement.direction = util.randomFloatFromInterval(-Math.PI, Math.PI);
      }

      const scanDist = 6;

      // reverse direction if moving into a danger zone
      if (isInDangerZone(this.gameState.field, this.playerState.position)) {
        // TODO: look at surronding zones and go to a none on/transition one
        this.movement.direction = this.movement.direction;
      } else if (isMovingIntoDangerZone(this.gameState.field, this.playerState.position, this.movement.direction, scanDist)) {
        this.movement.direction += Math.PI;
        // redirect bot toward center when its too close to border
      } else if (isCloseToBorder(this.playerState.position)) {
        const angleToCenter = getAngleBetweenCoords(this.playerState.position,
          { x: configs.mapWidth / 2, y: configs.mapHeight / 2 });

        this.movement.direction = angleToCenter;
      }

      // move bot
      this.playerState.insertControlInput(this.movement.direction);
      this.movement.movementRepeatCount--;
    }
  }
}

module.exports = class BotManager {
  constructor(gameState, numInitBots) {
    this.gameState = gameState;
    this.bots = {};
    this.createBots(numInitBots);
  }

  createBots(numBots) {
    for (let i = 1; i <= numBots; ++i) {
      const botId = -i; // TODO: using negative # for ids in gameState to avoid conflicts; find cleaner solution
      const player = this.gameState.play(`Bot${botId}`, botId);
      this.bots[botId] = new BotPlayer(botId, player, this.gameState);
    }
  }

  tick() {
    Object.values(this.bots).forEach((bot) => {
      if (bot.isKilled()) {
        // rejoin game is killed
        const player = this.gameState.play(`Bot${bot.id}`, bot.id);
        this.bots[bot.id] = new BotPlayer(bot.id, player, this.gameState);
      } else {
        bot.tick();
      }
    });
  }
};
