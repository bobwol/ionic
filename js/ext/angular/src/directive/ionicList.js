(function() {
'use strict';

angular.module('ionic.ui.list', ['ngAnimate'])

.directive('linkItem', ['$timeout', function($timeout) {
  return {
    restrict: 'E',
    require: ['?^list'],
    replace: true,
    transclude: true,
    scope: {
      item: '=',
      onSelect: '&',
      onDelete: '&',
      canDelete: '@',
      canReorder: '@',
      canSwipe: '@',
      buttons: '=',
      type: '@',
      href: '@'
    },
    template: '<a href="{{href}}" class="item">\
            <div class="item-edit" ng-if="canDelete && showDelete">\
              <button class="button button-icon icon" ng-class="deleteIcon" ng-click="onDelete()"></button>\
            </div>\
            <div class="item-content" ng-transclude></div>\
             <div class="item-drag" ng-if="canReorder && showDelete">\
               <button data-ionic-action="reorder" class="button button-icon icon" ng-class="reorderIcon"></button>\
             </div>\
            <div class="item-options" ng-if="canSwipe && !showDelete && showOptions">\
             <button ng-click="buttonClicked(button)" class="button" ng-class="button.type" ng-repeat="button in buttons">{{button.text}}</button>\
           </div>\
          </a>',

    link: function($scope, $element, $attr, list) {
      // Grab the parent list controller
      if(list[0]) {
        list = list[0];
      } else if(list[1]) {
        list = list[1];
      }

      $attr.$observe('href', function(value) {
        $scope.href = value;
      });

      // Add the list item type class
      $element.addClass($attr.type || 'item-complex');

      if($attr.type !== 'item-complex') {
        $scope.canSwipe = false;
      }

      $scope.showDelete = false;
      $scope.deleteIcon = list.scope.deleteIcon;
      $scope.reorderIcon = list.scope.reorderIcon;
      $scope.showOptions = true;

      $scope.buttonClicked = function(button) {
        button.onButtonClicked && button.onButtonClicked($scope.item, button);
      };

      var deregisterListWatch = list.scope.$watch('showDelete', function(v) {
        $scope.showDelete = v;

        // Add a delay before we allow the options layer to show, to avoid any odd
        // animation issues
        if(!v) {
          $timeout(function() {
            $scope.showOptions = true;
          }, 200);
        } else {
          $scope.showOptions = false;
        }
      });

      $scope.$on('$destroy', function () {
        deregisterListWatch();
      });
    }
  };
}])

.directive('item', [function() {
  return {
    restrict: 'E',
    require: ['?^list'],
    replace: true,
    transclude: true,
    scope: {
      item: '=',
      deleteIcon: '@',
      reorderIcon: '@',
      onSelect: '&',
      onDelete: '&',
      canDelete: '@',
      canReorder: '@',
      canSwipe: '@',
      optionButtons: '=',
      type: '@'
    },
    template: '<li class="item item-complex">\
            <div class="item-edit" ng-if="canDelete && insertDelete">\
              <button class="button button-icon icon" ng-class="item.deleteIcon || deleteIcon" ng-click="deleteClicked()"></button>\
            </div>\
            <div class="item-content" ng-transclude></div>\
            <div class="item-drag" ng-if="canReorder && insertReorder">\
              <button data-ionic-action="reorder" class="button button-icon icon" ng-class="item.reorderIcon || reorderIcon"></button>\
            </div>\
            <div class="item-options" ng-if="canSwipe && insertOptions">\
             <button ng-click="buttonClicked(b)" class="button" ng-class="b.type" ng-repeat="b in optionButtons" ng-bind="b.text"></button>\
           </div>\
          </li>',

    link: function($scope, $element, $attr, list) {
      // Grab the parent list controller
      if(list[0]) {
        list = list[0];
      } else if(list[1]) {
        list = list[1];
      }

      var el = $element[0];
      var itemContent = el.querySelector('.item-content');

      if($attr.type) {
        el.classList.add($attr.type);
      }

      // This will override the item's default buttons
      // if the individual item was given its own buttons property
      if($scope.item.optionButtons && $scope.item.optionButtons.length) {
        $scope.optionButtons = $scope.item.optionButtons;
      }

      // Decide if it should go in the DOM when it loads
      $scope.insertDelete = false;
      $scope.insertReorder = false;
      $scope.insertOptions = ($scope.optionButtons && $scope.optionButtons.length > 0);

      if($scope.item.itemIconLeft) {
        el.classList.add('item-icon-left');
        angular.element(itemContent).prepend('<i class="icon ' + $scope.item.itemIconLeft + '"></i>')
      }

      if($scope.item.itemIconRight) {
        el.classList.add('item-icon-right');
        angular.element(itemContent).append('<i class="icon ' + $scope.item.itemIconRight + '"></i>')
      }

      $scope.deleteClicked = function() {
        if($scope.item.onDelete) {
          $scope.item.onDelete($scope.item);
        } else {
          $scope.onDelete($scope.item);
        }
      };

      $scope.buttonClicked = function(button) {
        button.onClick && button.onClick($scope.item, button);
      };

      var destroyShowDeleteWatch = list.scope.$watch('showDelete', function(val) {
        if(val) $scope.insertDelete = true;
      });

      var destroyShowReorderWatch = list.scope.$watch('showReorder', function(val) {
        if(val) $scope.insertReorder = true;
      });

      $scope.$on('$destroy', function () {
        destroyShowDeleteWatch();
        destroyShowReorderWatch();
      });
    }
  };
}])

.directive('list', ['$timeout', function($timeout) {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,

    scope: {
      showDelete: '=',
      showReorder: '=',
      hasPullToRefresh: '@',
      onRefresh: '&',
      onRefreshOpening: '&',
      refreshComplete: '='
    },

    controller: function($scope) {
      // var _this = this;

      // $scope.$watch('showDelete', function(v) {
      //   _this.showDelete = true;
      // });

      this.scope = $scope;
    },

    template: '<ul class="list" ng-class="{\'list-editing\': showDelete, \'list-reordering\': showReorder}" ng-transclude></ul>',

    link: function($scope, $element, $attr) {
      var lv = new ionic.views.ListView({
        el: $element[0],
        listEl: $element[0].children[0],
        hasPullToRefresh: ($scope.hasPullToRefresh !== 'false'),
        onRefresh: function() {
          $scope.onRefresh();
          $scope.$parent.$broadcast('scroll.onRefresh');
        },
        onRefreshOpening: function(amt) {
          $scope.onRefreshOpening({amount: amt});
          $scope.$parent.$broadcast('scroll.onRefreshOpening', amt);
        },
        onReorder: function(el, oldIndex, newIndex) {
          $scope.$apply(function() {
            $scope.onReorder({el: el, start: oldIndex, end: newIndex});
          });
        }
      });

      $scope.listView = lv;

      if($attr.refreshComplete) {
        $scope.refreshComplete = function() {
          lv.doneRefreshing();
          $scope.$parent.$broadcast('scroll.onRefreshComplete');
        };
      }

      if($attr.animation) {
        $element.addClass($attr.animation);
      }

      var destroyShowReorderWatch = $scope.$watch('showReorder', function(val) {
        if(val) {
          $element[0].classList.add('item-options-hide');
        } else if(val === false) {
          // false checking is because it could be undefined
          // if its undefined then we don't care to do anything
          $timeout(function(){
            $element[0].classList.remove('item-options-hide');
          }, 250);
        }
      });

      $scope.$on('$destroy', function () {
        destroyShowReorderWatch();
      });

    }
  };
}]);

})();
