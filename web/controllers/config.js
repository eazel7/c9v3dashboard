angular
.module('c9dashboard.controllers.config', [
  'ng',
  'ngRoute',
  'mgcrea.ngStrap.collapse',
  'c9dashboard.navbar',
  'c9dashboard.services.config'])
.config(function ($routeProvider) {
  $routeProvider
  .when('/config', {
    templateUrl: 'views/config.html',
    controller: 'Config',
    controllerAs: 'config'
  });
})
.run(function (C9DashboardNavbar) {
  C9DashboardNavbar.push({
    title: 'Config',
    url: '/config',
    icon: 'glyphicon-cog'
  });
})
.controller('Config', function($scope, $http, C9DashboardConfig) {
  var config = this;

  C9DashboardConfig
  .isConfigured()
  .then(function (isConfigured) {
    config.isConfigured = isConfigured;

    if (isConfigured) {
      C9DashboardConfig.getConfig()
      .then(function (latestConfig) {
        config.latest = latestConfig;
      }, function (err) {
        config.error = error;
      });
    }
  });

  config.installDefaults = function () {
    C9DashboardConfig
    .installDefaults()
    .then(function () {
      C9DashboardConfig
      .getConfig()
      .then(function (latestConfig) {
        config.error = null
        config.latest = latestConfig;
        config.saved = true;
      }, function (err) {
        config.error = err;
      })
    }, function (err) {
      config.error = err;
    });
  };

  config.save = function () {
    C9DashboardConfig
    .setConfig(config.latest)
    .then(function () {
      config.error = null;
      config.saved = true;
    }, function (err) {
      config.error = err;
    });
  };
});
