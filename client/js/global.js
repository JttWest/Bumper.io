const global = {};

module.exports = {
  register: (name, obj) => {
    global[name] = obj;
  },

  get: (name) => {
    if (!global[name])
      throw new Error(`GET: Global data with key '${name}' doesn't exist`);

    return global[name];
  },

  update: (name, obj) => {
    if (!global[name])
      throw new Error(`UPDATE: Global data with key '${name}' doesn't exist`);

    global[name] = obj;
  }
};
