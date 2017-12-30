const status = require('../../shared/enums').client.appStatus;

// const global = {
// };

let appStatus = status.MAIN;

module.exports = {
  getAppStatus: () => appStatus,

  setAppStatus: (newStatus) => {
    if (!status[newStatus])
      throw new Error(`Attempting to update app status with invalid value: ${newStatus}`);

    appStatus = status[newStatus];
  },

  // get: (name) => {
  //   if (!global.hasOwnProperty(name))
  //     throw new Error(`Global data with key '${name}' doesn't exist`);

  //   return global[name];
  // },

  // set: (name, obj) => {
  //   if (!global.hasOwnProperty(name))
  //     throw new Error(`Global data with key '${name}' doesn't exist`);

  //   global[name] = obj;
  // }
};
