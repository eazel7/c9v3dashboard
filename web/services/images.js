angular
.module('c9dashboard.services.images', ['ng'])
.service('C9DashboardImages', function ($http, $q) {
  return {
    listImages: function () {
      var def = $q.defer();

      $http.get('/api/images')
      .success(def.resolve)
      .error(def.reject);

      return def.promise;
    },
    listInstancesForImage: function (image) {
      var def = $q.defer();

      $http.get('/api/images/' + encodeURIComponent(image) + '/instances')
      .success(def.resolve)
      .error(def.reject);

      return def.promise;
    },
    createInstance: function (imageId, displayName, workspaceName) {
      var def = $q.defer();

      $http.post('/api/images/' + encodeURIComponent(imageId) + '/instances', {
        displayName: displayName,
        workspace: workspaceName
      })
      .success(def.resolve)
      .error(def.reject);

      return def.promise;
    }
  };
});
