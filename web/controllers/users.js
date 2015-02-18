angular
.module('c9dashboard.controllers.users', [
  'ng',
  'ngRoute',
  'c9dashboard.navbar',
  'c9dashboard.services.users'])
.config(function ($routeProvider) {
  $routeProvider
  .when('/users', {
    templateUrl: 'views/users.html',
    controller: 'Users',
    controllerAs: 'users'
  })
  .when('/users/new', {
    templateUrl: 'views/new-user.html',
    controller: 'NewUser',
    controllerAs: 'newUser'
  });
})
.run(function (C9DashboardNavbar) {
  C9DashboardNavbar.push({
    title: 'Users',
    url: '/users',
    icon: 'glyphicon-user'
  });
})
.controller('Users', function($scope, $location, C9DashboardUsers) {
  var ctrl = this;

  C9DashboardUsers
  .listUsers()
  .then(function (users) {
    ctrl.users = users;
  }, function (err) {
    ctrl.error = err;
  });

  ctrl.createNew = function () {
    $location.url('/users/new');
  };
})
.controller('NewUser', function ($scope, $location, C9DashboardUsers) {
  var ctrl = this;

  ctrl.defaultPassword = 'P@ssw0rd!';
  ctrl.password = ctrl.defaultPassword;

  ctrl.save = function () {
    C9DashboardUsers
    .setUser({
      username: ctrl.username,
      password: ctrl.password,
      displayName: ctrl.displayName
    })
    .then(function () {
      $location.url('/users');
    }, function (err) {
      ctrl.error = err || 'Unknown error';
    });
  };
});
