module.exports = {
  shared: {
    port: 3000,
    tickInterval: 50,
    tickBufferSize: 3,
    mapWidth: 600,
    mapHeight: 600,
    playerRadius: 20,
    playerSpeed: 3,
    playerDashSpeed: 10,
    attackRadius: 60,
    attackCountdown: 100,
    zoneWidth: 100,
    zoneHeight: 100,
    maxOnZones: 2,
    zoneTransitionCountdown: 50,
    zoneBorderSize: 1,
    zone: {
      minOnDuration: 100,
      maxOnDuration: 500
    },
    collisionDisplacementDuration: 20,
    maxPlayerLimit: 10,
  },
  client: {
    isDebugMode: false,
    clientPlayerColor: 'lime',
    otherPlayersColor: '#2274A5',
    zoneBorderColor: 'black'
  },
  server: {
    passcodeExpiration: 30000, // 30 seconds
    gameRoom: {
      maxRooms: 1,
      maxPlayers: 10
    }
  }
};
