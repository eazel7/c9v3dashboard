var fs = require('fs'),
    nedb = require('nedb'),
    path = require('path');

function ConfigAPI(rootDir, bus) {
  this.rootDir = rootDir;
  this.dataDir = path.join(rootDir, 'data')
  this.configPath = path.join(this.dataDir, 'config.json');
  this.defaultsPath = path.join(this.dataDir, 'defaults.json');
  this.bus = bus;
};

ConfigAPI.prototype.isConfigured = function (callback) {
  fs.lstat(this.configPath, function (err, stat) {
    if (err) return callback (err);

    return callback (null, stat.isFile());
  });
};

ConfigAPI.prototype.getConfig = function (callback) {
  var configPath = this.configPath;

  this.isConfigured(function (err, isConfigured) {
    if (err) return callback(err);

    if (!isConfigured) return callback (new Error('Not configured'));

    fs.readFile(configPath, 'utf8', function (err, data) {
      if (err) return callback (err);

      try {
        var config = JSON.parse(data);

        callback(null, config);
      } catch (e) {
        callback(e);
      }
    });
  });
};

ConfigAPI.prototype.setConfig = function (newConfig, callback) {
  var bus = this.bus;

  fs.writeFile(this.configPath, JSON.stringify(newConfig, undefined, 2), function (err) {
    if (err) return callback (err);

    bus.emit('config-changed', newConfig);

    callback();
  });
};

ConfigAPI.prototype.installDefaults = function (callback) {
  var self = this;

  fs.readFile(self.defaultsPath, 'utf8', function (err, data) {
    if (err) return callback (err);

    self.setConfig(JSON.parse(data), callback);
  });
};

module.exports = ConfigAPI;
