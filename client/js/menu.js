const global = require('./global');
const graphics = require('./graphics');

// hide game view and show only main menu on start
$('#gameView').hide();

const showStandbyMenu = () => {
  $('#standbyMenu')
    .modal({
      inverted: true,
      transition: 'scale'
    })
    .modal('show');
};

const onJoinButtonClick = () => {
  // TODO: make api call to server and wait for response; this is for success only
  $('#mainMenu').hide();
  $('#gameView').show();

  global.setAppStatus('STANDBY');

  graphics.renderLoop();
  showStandbyMenu();
};

const onPlayButtonClick = () => {
  const name = $('#nameInput').val();
  const gameState = global.get('gameState');
  const clientPlayer = gameState.play(name);

  global.set('clientPlayer', clientPlayer);
  global.setAppStatus('PLAYING');

  $('#standbyMenu')
    .modal('hide');

  $('#canvas').focus();
};

$('#joinButton').click(onJoinButtonClick);
$('#playButton').click(onPlayButtonClick);

module.exports = {
  showStandbyMenu
};
