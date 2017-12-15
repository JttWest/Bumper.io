const global = {
  clientPlayer: null,
  gameState: null,
};

const status = {
  PLAYING: 'PLAYING',
  STANDBY: 'STANDY',
  MENU: 'MENU'
};

let appStatus = status.MENU;

module.exports = {
  getAppStatus: () => appStatus,

  updateAppStatus: (newStatus) => {
    if (!status[newStatus])
      throw new Error(`Attempting to update app status with invalid value: ${newStatus}`);

    appStatus = status[newStatus];
  },

  get: (name) => {
    if (!global.hasOwnProperty(name))
      throw new Error(`Global data with key '${name}' doesn't exist`);

    return global[name];
  },

  set: (name, obj) => {
    if (!global.hasOwnProperty(name))
      throw new Error(`Global data with key '${name}' doesn't exist`);

    global[name] = obj;
  }
};
