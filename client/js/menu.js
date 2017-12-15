const global = require('./global');

const joinGame = () => {
  const name = $('#nameInput').val();
  const gameState = global.get('gameState');
  const clientPlayer = gameState.play(name);

  global.set('clientPlayer', clientPlayer);
  global.setAppStatus('PLAYING');
};

$('#playButton').click(() => {
  $('#canvas').focus();

  joinGame();

  $('#standbyMenu')
    .modal('hide');
});

const showStandbyMenu = () => {
  $('#standbyMenu')
    .modal({
      inverted: true,
      transition: 'scale'
    })
    .modal('show');
};

module.exports = {
  showStandbyMenu
};
