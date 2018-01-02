const mainView = () => {
  $('#mainMenu').show();
  $('#gameView').hide();
};

const gameView = () => {
  $('#mainMenu').hide();
  $('#gameView').show();
};

const showStandbyMenu = () => {
  $('#standbyMenu')
    .modal({
      closable: false,
      inverted: true,
      transition: 'scale'
    })
    .modal('show');
};

const hideStandbyMenu = () => {
  $('#standbyMenu')
    .modal('hide');
};

const disableAndLoadButton = (button) => {
  button.addClass('disabled loading');
};

const enableButton = (button) => {
  button.removeClass('disabled loading');
};

const showErrorMessage = (message) => {
  $('#errorMessage').text(message);

  $('#error').show();

  setTimeout(() => $('#error').hide(), 2000);
};

module.exports = {
  mainView,
  gameView,

  showStandbyMenu,
  hideStandbyMenu,

  showErrorMessage,

  setCanvasSize: (width, height) => {
    $('#canvasContainer').width(width).height(height);

    $('#canvas')
      .prop('width', width)
      .prop('height', height);
  },

  disableAndLoadJoinButton: () => {
    disableAndLoadButton($('#joinButton'));
  },

  enableJoinButton: () => {
    enableButton($('#joinButton'));
  },

  disableAndLoadPlayButton: () => {
    disableAndLoadButton($('#playButton'));
  },

  enablePlayButton: () => {
    enableButton($('#playButton'));
  },

  registerOnJoinButtonClick: (func) => {
    $('#joinButton').off('click');
    $('#joinButton').click(func);
  },

  registerOnPlayButtonClick: (func) => {
    $('#playButton').off('click');
    $('#playButton').click(func);
  }
};
