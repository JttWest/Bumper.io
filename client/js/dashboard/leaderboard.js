/**
 * @param {*} leaderboardData an array of name and point pairs
 */

const update = (leaderboardData) => {
  const scoreboardElements = leaderboardData
    .sort((p1, p2) => {
      // order the players in reverse (most points is first)
      if (p1.points > p2.points)
        return -1;
      else if (p1.points < p2.points)
        return 1;

      return 0;
    })
    .map(playerData => `<div class="item">
                      <div class="right floated content">
                        <span>${playerData.points}</span>
                      </div>
                      <div class="content">
                        ${playerData.name}
                      </div>
                    </div>`);

  $('#playerRanking').html(scoreboardElements.join(''));
};

module.exports = {
  update
};
