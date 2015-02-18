var path = require('path');

var LocalUsers = require('./local');

function UsersAPI(configApi) {
  this.configApi = configApi;
}

function getProvider(configApi, callback) {
  configApi.getConfig(function (err, config) {
    if (err) return callback (err);

    switch (config.usersSource) {
      case 'local':
        return callback(null, new LocalUsers(path.join(configApi.dataDir, 'users.db')));
      default:
        return callback('Not implemented');
    }
  });
}

UsersAPI.prototype.listUsers = function (callback) {
  getProvider(this.configApi, function (err, provider) {
    if (err) return callback (err);

    provider.listUsers(callback);
  })
};

UsersAPI.prototype.getUser = function (username, callback) {
  getProvider(this.configApi, function (err, provider) {
    if (err) return callback(err);

    provider.getUser(username, callback);
  });
};

UsersAPI.prototype.setUser = function (user, callback) {
  getProvider(this.configApi, function (err, provider) {
    if (err) return callback(err);

    provider.setUser(user, callback);
  });
};

module.exports = UsersAPI;
