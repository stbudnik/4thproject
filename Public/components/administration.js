angular.module('myApp').component('administration', {
    bindings: { administration: '<' },
    templateUrl: "templates/administration.html",
    controller: function($scope, $rootScope, $http) {
        $rootScope.IsVisible = true;
        $http({url: '/admin'}).then(function (response) {
            $scope.admins = response.data;
        }.bind(this));
    },  
});