var express = require('express'),
    Docker = require('dockerode'),
    async = require('async'),
    bodyParser = require('body-parser');

var API = require('./api');

var api = new API(__dirname);

var app = express();
var docker = new Docker({socketPath: '/var/run/docker.sock'});

app.get('/api/config', function (req, res, next) {
  api.config.isConfigured(function (err, isConfigured) {
    if (err) return next(err);

    if (!isConfigured) {
      res.status(410);
      return res.end();
    }

    api.config.getConfig(function (err, config) {
      if (err) return next(err);

      res.json(config);
    });
  });
});

app.get('/api/users/:username', function (req, res, next) {
  api.users.getUser(req.params.username, function (err, user) {
    if (err) return next(err);

    res.json(user);
  });
});

app.get('/api/users', function (req, res, next) {
  api.users.listUsers(function (err, users) {
    if (err) return next(err);

    res.json(users);
  });
});

app.post('/api/users', bodyParser.json(), function (req, res, next) {
  var user = req.body;

  api.users.setUser(user, function (err) {
    if (err) return next(err);

    res.redirect('/api/users/' + encodeURIComponent(user.username));
  });
});

app.post('/api/config/installDefaults', bodyParser.json(), function (req, res, next) {
  api.config.installDefaults(function (err) {
    if (err) return next(err);

    res.redirect('/api/config');
  })
});

app.post('/api/config', bodyParser.json(), function (req, res, next) {
  var newConfig = req.body;

  api.config.setConfig(newConfig, function (err) {
    if (err) return next(err);

    api.config.getConfig(function (err, config) {
      if (err) return next(err);

      res.json(config);
    })
  });
});

app.get('/api/images/:image/instances', bodyParser.json(), function (req, res, next) {
  api.images.listInstancesForImage(
    req.params.image,
    function (err, instances) {
      if (err) return next(err);

      res.json(instances);
    });
});

app.get('/api/images', function (req, res, next) {
  api.images.listImages(function (err, images) {
    if (err) return next(err);

    res.json(images);
  });
});

app.get('/api/image/:image/instances', function (req, res, next) {
  api.images.listInstancesForImage(
    req.params.image,
    function (err, instances) {
      if (err) return next(err);

      res.json(instances);
    });
});

app.post(
  '/api/images/:imageId/instances',
  bodyParser.json(),
  function (req, res, next) {
    api.images.createInstance(
      req.params.imageId,
      req.body.displayName,
      req.body.workspace,
      function (err, instance) {
        if (err) return next(err);

        res.json(instance);
      });
  });

app.get('/api/instances', function (req, res, next) {
  api.images.listInstances(function (err, instances) {
    if (err) return next(err);

    res.json(instances);
  });
});

app.use(express.static(require('path').join(__dirname, 'web')));

var morgan = require('morgan');
app.use(morgan('combined'))

app.listen(process.env.PORT, function() {
  console.log('Listening on http://localhost:' + String(process.env.PORT));
});
