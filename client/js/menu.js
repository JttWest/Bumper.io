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

module.exports = {
  showStandbyMenu,
  hideStandbyMenu,

  registerOnJoinButtonClick: (func) => {
    $('#joinButton').click(func);
  },

  registerOnPlayButtonClick: (func) => {
    $('#playButton').click(func);
  }
};
