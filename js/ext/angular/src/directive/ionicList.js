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
    require: '?^list',
    replace: true,
    transclude: true,

    scope: {
      item: '=',
      itemType: '@',
      canDelete: '=',
      canReorder: '=',
      canSwipe: '=',
      onDelete: '=',
      optionButtons: '=',
      deleteIcon: '@',
      reorderIcon: '@'
    },
    
    template: '<li class="item item-complex" ng-class="itemClass">\
            <div class="item-edit" ng-if="canDeleteItem && insertDelete">\
              <button class="button button-icon icon" ng-class="deleteIconClass" ng-click="deleteClicked()"></button>\
            </div>\
            <div class="item-content" ng-transclude></div>\
            <div class="item-drag" ng-if="canReorderItem && insertReorder">\
              <button data-ionic-action="reorder" class="button button-icon icon" ng-class="reorderIconClass"></button>\
            </div>\
            <div class="item-options" ng-if="canSwipeItem && insertOptions">\
             <button ng-click="b.onClick(item, b)" class="button" ng-class="b.type" ng-repeat="b in itemOptionButtons" ng-bind="b.text"></button>\
           </div>\
          </li>',

    link: function($scope, $element, $attr, list) {

      var itemData = $scope.item || {};
      var parentScope = (list && list.scope);

      // Set this item's class, first from the item directive attr, and then the list attr if item not set
      $scope.itemClass = $scope.itemType || parentScope.itemType;

      // Set the option buttons which can be revealed by swiping to the left
      $scope.itemOptionButtons = itemData.optionButtons || $scope.optionButtons || parentScope.optionButtons;

      // Decide if it should go in the DOM when it loads
      $scope.insertDelete = false;
      $scope.insertReorder = false;
      $scope.insertOptions = ($scope.itemOptionButtons && $scope.itemOptionButtons.length > 0);

      // Decide if this item can do stuff, and follow a certain priority on where the value comes from
      $scope.canDeleteItem = ($scope.canDelete === true || $scope.canDelete === false ? $scope.canDelete : parentScope.canDelete);
      $scope.canReorderItem = ($scope.canReorder === true || $scope.canReorder === false ? $scope.canReorder : parentScope.canReorder);
      $scope.canSwipeItem = ($scope.canSwipe === true || $scope.canSwipe === false ? $scope.canSwipe : parentScope.canSwipe);

      // Set which icons to use for deleting and reordering, and ends up wth defaults
      $scope.deleteIconClass = itemData.deleteIcon || $scope.deleteIcon || parentScope.deleteIcon || 'ion-minus-circled';
      $scope.reorderIconClass = itemData.reorderIcon || $scope.reorderIcon || parentScope.reorderIcon || 'ion-navicon';

      $scope.deleteClicked = function() {
        if(itemData.onDelete) {
          // this item data has its own onDelete method
          itemData.onDelete(itemData);

        } else if($attr.onDelete) {
          // this item has an on-delete attribute
          $scope.onDelete(itemData);

        } else {
          // run the parent list's onDelete method
          // if it doesn't exist nothing will happen
          parentScope.onDelete(itemData);
        }
      };

      // Watch the parent list's showDelete and showReorder
      var destroyShowDeleteWatch = parentScope.$watch('showDelete', function(val) {
        if(val) $scope.insertDelete = true;
      });

      var destroyShowReorderWatch = parentScope.$watch('showReorder', function(val) {
        if(val) $scope.insertReorder = true;
      });

      // remove the watches when this item destroys
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
      itemType: '@',
      canDelete: '=',
      canReorder: '=',
      canSwipe: '=',
      showDelete: '=',
      showReorder: '=',
      hasPullToRefresh: '@',
      onRefresh: '&',
      onRefreshOpening: '&',
      refreshComplete: '=',
      onDelete: '=',
      optionButtons: '=',
      deleteIcon: '@',
      reorderIcon: '@'
    },

    template: '<ul class="list" ng-class="{\'list-editing\': showDelete, \'list-reordering\': showReorder}" ng-transclude></ul>',

    controller: function($scope) {
      this.scope = $scope;
    },

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
