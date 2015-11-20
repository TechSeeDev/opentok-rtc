
!function(global) {
  'use strict';

  var userLayout = null;
  var currentLayout = null;
  var container = null;

  var items = {};

  var layouts = {
    'grid': Grid,
    'float': Float,
    'f2f_horizontal': F2FHorizontal,
    'f2f_vertical': F2FVertical,
    'hangout_horizontal': HangoutHorizontal,
    'hangout_vertical': HangoutVertical
  };

  var HANGOUT_BY_DEFAULT = 'hangout_horizontal';

  function isOnGoing(layout) {
    return Object.getPrototypeOf(currentLayout) === layout.prototype;
  }

  var handlers = {
    'layout': function(evt) {
      userLayout = evt.detail.type;
      rearrange();
    },
    'itemSelected': function(evt) {
      if (isGroup() && isOnGoing(Grid)) {
        userLayout = HANGOUT_BY_DEFAULT;
        rearrange(evt.detail.item);
      }
    },
    'emptyStage': function(evt) {
      userLayout = 'grid';
      rearrange();
    }
  };

  function init(selector) {
    container = document.querySelector(selector);
    LayoutView.init(container);
    ItemsHandler.init(container, items);
    Utils.addEventsHandlers('layoutMenuView:', handlers, global);
    Utils.addEventsHandlers('layoutView:', handlers, global);
    Utils.addEventsHandlers('hangout:', handlers, global);
  }

  function isHangoutRequired(item) {
    // New screen shared and 3 or more items implies going to hangout if this isn't our current
    // layout running
    return Utils.isScreen(item) && isGroup() &&
           !(isOnGoing(HangoutHorizontal) || isOnGoing(HangoutVertical));
  }

  function append(id, options) {
    var item = LayoutView.append(id, options);
    items[id] = item;
    if (isHangoutRequired(item)) {
      userLayout = HANGOUT_BY_DEFAULT;
      rearrange(item);
    } else {
      rearrange();
    }
    Utils.sendEvent('layoutManager:itemAdded', {
      item: item
    });
    return item.querySelector('.opentok-stream-container');
  }

  function remove(id) {
    var item = items[id];
    if (!item) {
      return;
    }

    LayoutView.remove(item);
    delete items[id];
    Utils.sendEvent('layoutManager:itemDeleted', {
      item: item
    });
    rearrange();
  }

  function getTotal() {
    return Object.keys(items).length;
  }

  function calculateCandidateLayout() {
    var candidateLayout = null;

    if (getTotal() > 2) {
      candidateLayout = GRP_LAYOUTS[userLayout] ? layouts[userLayout] : Grid;
    } else {
      candidateLayout = F2F_LAYOUTS[userLayout] ? layouts[userLayout] : Float;
    }

    return candidateLayout;
  }

  var F2F_LAYOUTS = {
    float: true,
    f2f_horizontal: true,
    f2f_vertical: true
  };

  var GRP_LAYOUTS = {
    grid: true,
    hangout_horizontal: true,
    hangout_vertical: true
  };

  function isGroup() {
    return getTotal() > 2;
  }

  function updateAvailableLayouts() {
    Utils.sendEvent('layoutManager:availableLayouts', {
      layouts: isGroup() ? GRP_LAYOUTS : F2F_LAYOUTS
    });
  }

  function rearrange(item) {
    var candidateLayout = calculateCandidateLayout();

    if (!currentLayout || !isOnGoing(candidateLayout)) {
      currentLayout && currentLayout.destroy();
      currentLayout = new candidateLayout(container, items, item);
    }

    currentLayout.rearrange();
    updateAvailableLayouts();
  }

  global.LayoutManager = {
    init: init,
    append: append,
    remove: remove
  };

}(this);
