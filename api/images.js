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
    filename: path.join(configApi.dataDir, 'instances.db'),
    autoload: true
  });

  var self = this;

  var updateConfig = function (newConfig) {
    if (equal(self.latestConfig, newConfig)) return;

    self.latestConfig = newConfig;

    self.docker = new Docker(newConfig.docker);
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
      try {
        docker
        .getContainer(doc.container)
        .inspect(function (err, info) {
          if (err) {
            instances.push({
              workspace: doc.workspace,
              displayName: doc.displayName,
              image: doc.image,
              slug: doc.slug,
              status: 'stopped',
              container: doc.container
            });
          } else {
            instances.push({
              ip: info.NetworkSettings.IPAddress,
              container: doc.container,
              workspace: doc.workspace,
              displayName: doc.displayName,
              image: doc.image,
              slug: doc.slug,
              status: 'running'
            });
          }

          callback();
        });
      } catch (e) {
        instances.push({
          workspace: doc.workspace,
          displayName: doc.displayName,
          image: doc.image,
          slug: doc.slug,
          status: 'stopped'
        });

        callback();
      }
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

ImagesAPI.prototype.getInstanceForSlug = function (slug, callback) {
  listInstances.apply(this, [{
    slug: slug
  }, function (err, instances) {
    if (err) return callback (err);

    return callback (null, instances[0]);
  }]);
};

ImagesAPI.prototype.createInstance = function (imageId, displayName, workspaceName, callback) {
  var docker = this.docker,
      bus = this.bus,
      collection = this.collection;

  if(!docker) return callback (new Error('Docker connection not ready'));

  if (!imageId) return callback (new Error('No image id given'));
  if (!workspaceName) return callback (new Error('No workspace name given'));

//  if (!/^[a-z][a-z0-9_-]{3,16}$/.exec(workspaceName)) return callback (new Error('Invalid workspace name'));

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
    var createdInstance;

    async.series([function (callback) {
      docker.pull(image.name, function (err, stream) {
	console.error('Pull err:', err);
        if (err) return callback (err);

        if (stream.ended) return callback ();

        stream.resume();
        stream.on('end', callback);
      });
    }, function (callback) {
      mkdirp(workspacePath, callback);
    }, function (callback) {
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
            imageName: image.name,
            slug: require('slugify2')(image.name + '_' + workspaceName)
          };

          collection.insert(instance, function (err) {
            createdInstance = instance;
            callback(err);
          });
        });
      });
    }], function (err) {
      console.log(err, createdInstance);
      callback(err, createdInstance);
    });
  });
};

ImagesAPI.prototype.destroyInstance = function (instanceId, callback) {
  
};

module.exports = ImagesAPI;
