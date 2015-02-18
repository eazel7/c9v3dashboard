angular.module('c9dashboard.services.config', ['ng'])
.service('C9DashboardConfig', function ($http, $q) {
  return {
    isConfigured: function () {
      var defer = $q.defer();

      $http.get('/api/config')
      .success(function () {
        defer.resolve(true);
      })
      .error(function (err, status) {
        if (status === 410) return defer.resolve(false);

        defer.reject(err || 'Unkown error');
      });

      return defer.promise;
    },
    getConfig: function () {
      var defer = $q.defer();

      $http.get('/api/config')
      .success(function (config) {
        defer.resolve(config);
      })
      .error(function (body, status) {
        if (status === 410) {
          defer.reject('Not configured');
        } else {
          defer.reject(body || 'Unkown error');
        }
      });

      return defer.promise;
    },
    setConfig: function (newConfig) {
      var defer = $q.defer();

      $http.post('/api/config', newConfig)
      .success(defer.resolve)
      .error(defer.reject);

      return defer.promise;
    },
    installDefaults: function () {
      var defer = $q.defer();

      $http.post('/api/config/installDefaults')
      .success(defer.resolve)
      .error(defer.reject);

      return defer.promise;
    }
  };
})
