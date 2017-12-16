const global = require('../global');

const leaderboardUpdateInterval = 1000;

const updateLeaderboard = () => {
  const gameState = global.get('gameState');

  const scoreboardElements = Object.values(gameState.players)
    .sort((p1, p2) => {
      // order the players in reverse (most points is first)
      if (p1.points > p2.points)
        return -1;
      else if (p1.points < p2.points)
        return 1;

      return 0;
    })
    .map(player => `<li>${player.name}: ${player.points}</li>`);

  $('#leaderboardContainer').html(scoreboardElements.join(''));
};

setInterval(updateLeaderboard, leaderboardUpdateInterval);
