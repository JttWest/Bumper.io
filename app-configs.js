module.exports = {
  shared: {
    port: 3000,
    tickInterval: 50,
    tickBufferSize: 5,
    mapWidth: 600,
    mapHeight: 600,
    playerRadius: 20,
    playerSpeed: 3,
    playerDashSpeed: 10,
    player: {
      startUnmaterializedDuration: 60
    },
    attackRadius: 60,
    attackCountdown: 100,
    zoneWidth: 100,
    zoneHeight: 100,
    maxOnZones: 3,
    zoneTransitionCountdown: 75,
    zone: {
      minOnDuration: 200,
      maxOnDuration: 1000
    },
    collisionDisplacementDuration: 20,
    maxPlayerLimit: 10 // doesn't include bots
  },
  client: {
    player: {
      clientColor: 'lime',
      otherColor: '#2274A5',
      unmaterializedTransparency: 0.5
    },
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
    inactiveTickLimit: 6000, // TODO: make timeout shorter
    debug: {
      active: true
    }
  }
};
