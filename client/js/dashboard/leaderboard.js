const update = (players) => {
  const scoreboardElements = players
    .sort((p1, p2) => {
      // order the players in reverse (most points is first)
      if (p1.points > p2.points)
        return -1;
      else if (p1.points < p2.points)
        return 1;

      return 0;
    })
    .map(player => `<div class="item">
                      <div class="right floated content">
                        <span>${player.points}</span>
                      </div>
                      <div class="content">
                        ${player.name}
                      </div>
                    </div>`);

  $('#playerRanking').html(scoreboardElements.join(''));
};

module.exports = {
  update
};
