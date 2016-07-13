'use strict';

/* Controller */
angular.module('myApp.controllers', []).
    controller('AppCtrl', function ($scope, $http) {
        // Insert controller code here
        $scope.init = function() {
            $http({
              method: 'GET',
              url: '/api/apparel'
            }).then(function successCallback(response) {
                $scope.styleCodeList = response.data;
              }, function errorCallback(response) {
                console.log(response);
              });
        };

        $scope.getApparelData = function() {
            $scope.chosenStyleCode = JSON.parse($scope.chosenStyleCode);
            $http({
              method: 'GET',
              url: '/api/apparel/' + $scope.chosenStyleCode.style_code
            }).then(function successCallback(response) {
                $scope.apparelData = response.data;
              }, function errorCallback(response) {
                console.log(response);
              });
        };

        $scope.getQuote = function() {
            $http({
              method: 'POST',
              data: {styleCode: $scope.chosenStyleCode.style_code, 
                    colorCode: $scope.chosenColorCode, sizeCode: $scope.chosenSizeCode, 
                    quantity: $scope.chosenQuantity, weight: $scope.chosenStyleCode.weight},
              url: '/api/quote'
            }).then(function successCallback(response) {
                if (isNaN(response.data)) {
                    $scope.price = 'Not in stock';
                    $scope.pricePerUnit = 'Not applicable';
                } else {
                    $scope.price = '$' + response.data;
                    $scope.pricePerUnit = '$' + Math.round(response.data / $scope.chosenQuantity * 100) / 100;
                }
              }, function errorCallback(response) {
                console.log(response);
              });
        };

    });