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

var dnsServer;

function checkDns(config) {
  if (config.useDns && !dnsServer) {
    var dns = require('native-dns');
 
    dnsServer = dns.createServer();

    dnsServer.on('request', function (request, response) {
      async.each(request.question, function (question, callback) {
        if (question.name.lastIndexOf(config.dnsSuffix) == question.name.length - config.dnsSuffix.length) {
          api.images.getInstanceForSlug(question.name.slice(0, question.name.length - config.dnsSuffix.length), function (err, instance) {
            if (!err && instance) {
       	      response.answer.push(dns.A({
                name: instance.slug + config.dnsSuffix,
                address: instance.ip,
                ttl: 600
              }));
            }

            callback();
          });
        } else {
          callback();
        }
      }, function (err) {
        response.send();
      });      
    });

    dnsServer.on('error', function (err, buff, req, res) {
      console.log(err.stack);
    });

    console.log('serving DNS');
    dnsServer.serve(53, process.env.IP);
  } else if (dnsServer && !config.useDns) {
    dnsServer.close();
    dnsServer = null;
  }
};

app.listen(process.env.PORT, function() {
  console.log('Listening on http://localhost:' + String(process.env.PORT));

  api.bus.on('config-changed', function (newConfig) {
    checkDns(newConfig);
  });

  api.config.getConfig(function (err, config) {
    if (err) return;

    checkDns(config);
  });
});
