var mkdirp = require('mkdirp'),
    path = require('path'),
    equal = require('deep-equal')
    Docker = require('dockerode'),
    async = require('async'),
    DataStore = require('nedb');

function isValidHostname(hostname) {
  if ([
    'localhost'
  ].indexOf(hostname.toLowerCase()) !== -1) return false;

  return /^(?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$/g.exec(hostname);
};

function ImagesAPI(configApi, bus) {
  this.configApi = configApi;
  this.bus = bus;
  this.collection = new DataStore({
    filename: path.join(configApi.dataDir, 'images.db'),
    autoload: true
  });

  var self = this;

  var updateConfig = function (newConfig) {
    if (equal(self.latestConfig, newConfig)) return;

    self.latestConfig = newConfig;

    self.docker = new Docker(newConfig.docker);

    // self.attachedAt = Date().now();
    // self.docker.getEvents((function (err, data) {
    //   if (this.docker !== self.docker) return;
    //
    //   console.log(err, data);
    // }).bind({
    //   docker: self.docker,
    //   imagesApi: images
    // }));
  };

  configApi.getConfig(function (err, newConfig) {
    if (!err) updateConfig(newConfig);
  })

  bus.on('config-changed', updateConfig);
}

ImagesAPI.prototype.listImages = function (callback) {
  this.configApi.getConfig(function (err, config) {
    if (err) return callback (err);

    callback (null, config.images);
  });
};

function listInstances (filter, callback) {
  var docker = this.docker;

  this.collection.find(filter, function (err, docs) {
    if (err) return callback (err);

    var instances = [];

    async.each(docs, function (doc, callback) {
      docker
      .getContainer(doc.container)
      .inspect(function (err, info) {
        if (err) return callback (err);

        instances.push({
          ip: info.NetworkSettings.IPAddress,
          workspace: doc.workspace,
          container: doc.container,
          displayName: doc.displayName,
          image: doc.image
        });

        callback ();
      });
    }, function (err) {
      if (err) return callback (err);

      callback (null, instances);
    });
  });
};

ImagesAPI.prototype.listInstances = function (callback) {
  listInstances.apply(this, [{}, callback]);
};

ImagesAPI.prototype.listInstancesForImage = function (imageId, callback) {
  listInstances.apply(this, [{
    imageId: imageId
  }, callback]);
};

ImagesAPI.prototype.createInstance = function (imageId, displayName, workspaceName, callback) {
  var docker = this.docker,
      bus = this.bus,
      collection = this.collection;

  if(!docker) return callback (new Error('Docker connection not ready'));

  if (!imageId) return callback (new Error('No image id given'));
  if (!workspaceName) return callback (new Error('No workspace name given'));

  if (!/^[a-z][a-z0-9_-]{3,16}$/.exec(workspaceName)) return callback (new Error('Invalid workspace name'));

  var workspacePath = path.join(this.configApi.dataDir, 'workspaces', workspaceName);

  this.configApi.getConfig(function (err, config) {
    if (err) return callback (err);

    for (var i = 0; i < config.images.length; i++) {
      if (config.images[i].id === imageId) {
        image = config.images[i];
        break;
      }
    }

    if (!image) return callback (new Error('Invalid image ID'));

    mkdirp(workspacePath, function (err) {
      if (err) return callback (err);

      docker.createContainer({
        Image: image.name,
        "Volumes": {
          "/workspace": {}
        }
      }, function (err, container) {
        if (err) return callback (err);

        container.start({
          "Binds": [workspacePath + ":/workspace"]
        }, function (err) {
          if (err) return callback (err);

          var instance = {
            container: container.id,
            displayName: displayName,
            workspace: workspaceName,
            imageId: imageId,
            imageName: image.name
          };

          collection.insert(instance, function (err) {
            callback(err, instance);
          });
        });
      });
    });
  });
};

ImagesAPI.prototype.destroyInstance = function (instanceId, callback) {

};

module.exports = ImagesAPI;
