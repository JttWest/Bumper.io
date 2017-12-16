const global = require('../global');

const leaderboardUpdateInterval = 1000;

const updateLeaderboard = () => {
  const gameState = global.get('gameState');

  const scoreboardElements = Object.values(gameState.players)
    .map(player => `<li>${player.name}: ${player.points}</li>`);

  $('#leaderboardContainer').html(scoreboardElements.join());
};

setInterval(updateLeaderboard, leaderboardUpdateInterval);
