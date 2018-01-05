const zoneStatus = require('./enums').shared.zoneStatus;

// controlInput = {
//   /*
//   1. Have angle in radian from -PI to PI
//   2. Convert to degrees
//   2. Set negative flag if negative
//   */
//   encode: () => {

//   },

//   decode: () => {

//   }
// }

/*
  id: this.id, Int8Array
  name: this.name, INGORE FOR NOW
  position: this.position, 2 Float32Array
  points: this.points, Uint16Array
  isKilled: this.isKilled, Uint8Array
  status: this.status

HEAD NUM_PLAYERS PLAYER... ZONE...

HEAD
Uint8Array Uint8Array
0000000    X
type       numPlayers

PLAYER
Int8Array  Float32Array  Float32Array   Uint16Array   Uint8Array
X          X             X              X             ------xx
id         x-coord       y-coord        points        isKilled, unMaterialized

ZONE
Uint8Array
------xx
transition, on

*/

const getZoneByIndex = (rowIndex, columnIndex) => {
  const zoneIndex = (rowIndex * this.numZonesH) + columnIndex;

  return this.zones[zoneIndex];
}

const playerSize = 1 + 4 + 4 + 2 + 1;
const playerOffset = 2; // start of players binary data
const zoneSize = 1;

// const numZonesH = configs.mapWidth / configs.zoneWidth;
// const numZonesV = configs.mapHeight / configs.zoneHeight;
// const numZones = numZonesH * numZonesV;

const gameStateSnapshot = {
  encode: (snapshot) => {
    const numPlayers = snapshot.players.length;
    const numZones = snapshot.field.zones.length;

    const bufferSize = 2 + playerSize * numPlayers + zoneSize * numZones;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const dataview = new DataView(arrayBuffer);

    // type -> 1 for gameStateSnapshot
    dataview.setUint8(0, 1);
    dataview.setUint8(1, numPlayers);

    // playerState
    const dataview2 = new DataView(arrayBuffer, playerOffset, numPlayers * playerSize);

    for (let i = 0; i < numPlayers; ++i) {
      const playerState = snapshot.players[i];
      dataview2.setInt8(i * playerSize, playerState.id);
      dataview2.setFloat32(1 + i * playerSize, playerState.position.x);
      dataview2.setFloat32(5 + i * playerSize, playerState.position.y);
      dataview2.setUint16(9 + i * playerSize, playerState.points);

      let statusFlags = 0;
      if (playerState.isKilled) statusFlags |= 0b1;
      if (playerState.status.unmaterialized) statusFlags |= 0b10;

      dataview2.setUint8(11 + i * playerSize, statusFlags);
    }

    // zones
    const zoneOffset = playerOffset + playerSize * numPlayers;
    const dataview3 = new DataView(arrayBuffer, zoneOffset, numZones * zoneSize);

    for (let i = 0; i < numZones; ++i) {
      const zoneState = snapshot.field.zones[i];

      let flag = 0;
      if (zoneState.status === zoneStatus.ON)
        flag = 0b1;
      else if (zoneState.status === zoneStatus.TRANSITION)
        flag = 0b10;

      dataview3.setUint8(i, flag);
    }

    return arrayBuffer;
  },

  decode: (arrayBuffer) => {
    const snapshot = {
      players: [],
      field: {
        zones: []
      }
    };

    const dataview = new DataView(arrayBuffer);
    const numPlayers = dataview.getUint8(1);

    const dataview2 = new DataView(arrayBuffer, 2, numPlayers * playerSize);

    // players
    for (let i = 0; i < numPlayers; ++i) {
      const id = dataview2.getInt8(i * playerSize);
      const positionX = dataview2.getFloat32(1 + i * playerSize);
      const positionY = dataview2.getFloat32(5 + i * playerSize);
      const points = dataview2.getUint16(9 + i * playerSize);

      const flags = dataview2.getUint8(11 + i * playerSize);

      const isKilled = (flags & 0b1) === 0b1;
      const unmaterialized = (flags & 0b10) === 0b10;

      snapshot.players.push({
        id,
        position: { x: positionX, y: positionY },
        points,
        isKilled,
        status: {
          unmaterialized
        }
      });
    }

    // zones
    const zoneOffset = playerOffset + playerSize * numPlayers;
    const dataview3 = new DataView(arrayBuffer, zoneOffset, arrayBuffer.byteLength - zoneOffset);

    for (let i = 0; i < arrayBuffer.byteLength - zoneOffset; ++i) {
      const flag = dataview3.getUint8(i);

      let status = zoneStatus.OFF;

      if (flag === 0b1)
        status = zoneStatus.ON;
      else if (flag === 0b10)
        status = zoneStatus.TRANSITION;

      snapshot.field.zones.push({ status });
    }

    return snapshot;
  }
};

/*
const client = {
  encode: () => {

  },
  decode: () => {

  }
};

const server = {
  encode: () => {

  },
  decode: () => {

  }
}; */

module.exports = {
  // client,
  // server
  gameStateSnapshot
};
