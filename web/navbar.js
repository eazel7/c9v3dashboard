angular
.module('c9dashboard.navbar', ['ng'])
.value('C9DashboardNavbar', [])
.controller('Navbar', function(C9DashboardNavbar, $scope, $location) {
  var navbar = this;

  navbar.menu = C9DashboardNavbar;

  navbar.isActive = function (menu) {
    return (menu.url === $location.url());
  };

  $scope.$on('$routeChangeSuccess', function (ev) {
    for (var i = 0; i < navbar.menu.length; i++) {
      if (navbar.isActive(navbar.menu[i])) {
        navbar.active = navbar.menu[i];

        break;
      }
    }

    navbar.active = null;
  })
});
