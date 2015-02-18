angular.module('c9dashboard', [
  'ng',
  'ngRoute',
  'c9dashboard.navbar',
  'c9dashboard.controllers.config',
  'c9dashboard.controllers.images',
  'c9dashboard.controllers.users'])
.config(function ($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'views/home.html',
    controller: 'Home'
  });
})
.controller('Home', function($scope, $http) {
});

$(document).ready(function () {
  angular.bootstrap(document, ['c9dashboard']);
});
