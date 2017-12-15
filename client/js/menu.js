const global = require('./global');

$('#standbyMenu')
  .modal('setting', 'transition', 'scale')
  .modal('show');

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
