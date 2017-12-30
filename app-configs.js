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
    zone: {
      minOnDuration: 100,
      maxOnDuration: 500
    },
    collisionDisplacementDuration: 20,
    maxPlayerLimit: 10 // doesn't include bots
  },
  client: {
    clientPlayerColor: 'lime',
    otherPlayersColor: '#2274A5',
    zone: {
      onColor: 'rgb(0, 0, 0)',
      offColor: 'rgb(0, 125, 0)',
      transitionColor: 'rgb(0, 70, 0)',
      borderColor: 'black',
      borderSize: 1
    },
    initJoinTimeout: 3000
  },
  server: {
    passcodeExpiration: 30000, // 30 seconds
    gameRoom: {
      maxRooms: 1,
      maxPlayers: 10
    },
    bot: {
      numPerRoom: 3
    },
    inactiveTickLimit: 600, // 30 second if tick interval is 50ms
    debug: {
      active: true
    }
  }
};
