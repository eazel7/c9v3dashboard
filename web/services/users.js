angular.module('c9dashboard.services.users', ['ng'])
.service('C9DashboardUsers', function ($http, $q) {
  return {
    listUsers: function () {
      var defer = $q.defer();

      $http.get('/api/users')
      .success(defer.resolve)
      .error(defer.reject);

      return defer.promise;
    },
    setUser: function (user) {
      var defer = $q.defer();

      $http.post('/api/users', user)
      .success(defer.resolve)
      .error(defer.reject);

      return defer.promise;
    },
    getUser: function (username) {
      var defer = $q.defer();

      $http.get('/api/users/' + encodeURIComponent(username))
      .success(defer.resolve)
      .error(defer.reject);

      return defer.promise;
    }
  };
});
