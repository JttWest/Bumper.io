const global = require('./global');

$('#playButton').click(() => {
  const name = $('#nameInput').val();
  const gameState = global.get('gameState');
  const clientPlayer = gameState.join(name);
  global.set('clientPlayer', clientPlayer);

  $('#canvas').focus();

  $('#standbyMenu')
    .modal('setting', 'transition', 'scale')
    .modal('hide');
});

const showStandbyMenu = () => {
  $('#standbyMenu')
    // .modal('setting', 'transition', 'scale')
    .modal({
      inverted: true
    })
    .modal('show');
};

module.exports = {
  showStandbyMenu
};
