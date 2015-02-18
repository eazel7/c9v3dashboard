angular.module('c9dashboard.controllers.images', [
  'ng',
  'ngRoute',
  'mgcrea.ngStrap.modal',
  'c9dashboard.services.images',
  'c9dashboard.navbar'])
.config(function ($routeProvider) {
  $routeProvider
  .when('/images', {
    controller: 'Images',
    controllerAs: 'images',
    templateUrl: '/views/images.html'
  })
  .when('/images/:imageId/instances', {
    controller: 'InstancesForImage',
    controllerAs: 'instances',
    templateUrl: '/views/instances-for-image.html'
  });
})
.run(function (C9DashboardNavbar) {
  C9DashboardNavbar
  .push({
    title: 'Images',
    url: '/images',
    icon: 'glyphicon-hdd'
  });
})
.controller('Images', function(
  $rootScope,
  C9DashboardImages,
  $modal) {
  var ctrl = this;

  C9DashboardImages
  .listImages()
  .then(function (images) {
    ctrl.images = images;
  }, function (err) {
    ctrl.error = err || 'Unknown error';
  });

  ctrl.createInstance = function (image) {
    var modalScope = angular.extend($rootScope.$new(), {
      newInstance: {
        image: image.id
      },
      confirm: function () {
        var newInstance = modalScope.newInstance;

        C9DashboardImages
        .createInstance(
          newInstance.image,
          newInstance.displayName,
          newInstance.workspace)
        .then(function (instance) {

        }, function (err) {
          modalScope.error = err || 'Unknown error';
        });
      }
    });

    var modal = $modal({
      title: image.displayName + ' (new instance)',
      contentTemplate: '/views/new-instance.html',
      show: true,
      backdrop: true,
      scope: modalScope
    });
  };
})
.controller('InstancesForImage', function (C9DashboardImages, $routeParams) {
  var ctrl = this;

  C9DashboardImages
  .listInstancesForImage($routeParams.imageId)
  .then(function (instances) {
    ctrl.instances = instances;
  }, function (err) {
    ctrl.error = err || 'Unkown error';
  })
});
