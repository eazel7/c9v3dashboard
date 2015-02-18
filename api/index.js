var ConfigAPI = require('./config'),
    ImagesAPI = require('./images'),
    UsersAPI = require('./users'),
    EventEmitter = require('events').EventEmitter;

function API(rootDir) {
  this.bus = new EventEmitter();

  this.config = new ConfigAPI(rootDir, this.bus);
  this.users = new UsersAPI(this.config);
  this.images = new ImagesAPI(this.config, this.bus);
};

module.exports = API;
