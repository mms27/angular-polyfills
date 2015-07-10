angular.module('ng.polyfills', []);

angular
  .module('ng.polyfills')
  .config(decorateNgModelDirective);

decorateNgModelDirective.$inject = ['$provide'];

function decorateNgModelDirective($provide) {
  $provide.decorator('ngModelDirective', enhancedNgModelDirective);
}

enhancedNgModelDirective.$inject = ['$delegate', '$controller', '$injector', '$rootScope'];

function enhancedNgModelDirective($delegate, $controller, $injector, $rootScope) {
  var ngModel = $delegate[0],
      ngModelController = ngModel.controller,
      ngModelCompile = ngModel.compile;

  ngModel.controller = newNgModelController;

  ngModel.compile = newNgModelCompile;

  newNgModelController.$inject = $injector.annotate(ngModelController);

  function newNgModelController($scope, $exceptionHandler, $attrs, $element, $parse, $animate) {
    var ctrl = this,
        TOUCHED_CLASS = 'ng-touched',
        UNTOUCHED_CLASS = 'ng-untouched';

    angular.extend(
      ctrl,
      $controller(ngModelController, {
        $scope: $scope,
        $exceptionHandler: $exceptionHandler,
        $attrs: $attrs,
        $element: $element,
        $parse: $parse,
        $animate: $animate
      })
    );

    ctrl.$touched = false;
    ctrl.$untouched = true;

    ctrl.$setUntouched = function() {
      ctrl.$touched = false;
      ctrl.$untouched = true;
      $animate.setClass($element, UNTOUCHED_CLASS, TOUCHED_CLASS);
    };

    ctrl.$setTouched = function() {
      ctrl.$touched = true;
      ctrl.$untouched = false;
      $animate.setClass($element, TOUCHED_CLASS, UNTOUCHED_CLASS);
    };
  }

  function newNgModelCompile() {
    var link = ngModelCompile.apply(null, arguments);

    function newLink(scope, element, attrs, ctrls) {
      var ctrl = ctrls[0];

      link.apply(null, arguments);

      element.on('blur', function () {
        if (ctrl.$touched) return;

        if ($rootScope.$$phase) {
          scope.$evalAsync(ctrl.$setTouched);
        } else {
          scope.$apply(ctrl.$setTouched);
        }
      });
    }

    return newLink;
  }

  return $delegate;
}