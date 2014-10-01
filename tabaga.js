/**
 * Object namespace
 */
var tabaga = {};

/**
 * Кросс-браузерный способ
 * получения координат курсора из события в обработчике а так же определение нажатой кнопки мыши.
 * 
 * @param e
 * @returns
 */
tabaga.fixEvent = function(e) {
	// получить объект событие для IE
	e = e || window.event;

	// добавить pageX/pageY для IE
	if ( e.pageX == null && e.clientX != null ) {
		var html = document.documentElement;
		var body = document.body;
		e.pageX = e.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html.clientLeft || 0);
		e.pageY = e.clientY + (html && html.scrollTop || body && body.scrollTop || 0) - (html.clientTop || 0);
	}

	// добавить which для IE
	if (!e.which && e.button) {
		e.which = e.button & 1 ? 1 : ( e.button & 2 ? 3 : ( e.button & 4 ? 2 : 0 ) );
	}

	return e;
};

tabaga.getOffsetRect = function(elem) {
    var box = elem.getBoundingClientRect();
 
    var body = document.body;
    var docElem = document.documentElement;
 
    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;
    var top  = box.top +  scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;
 
    return { top: Math.round(top), left: Math.round(left) };
};

tabaga.getOffsetSum = function(elem) {
    var top=0, left=0;
    while(elem) {
        top = top + parseInt(elem.offsetTop);
        left = left + parseInt(elem.offsetLeft);
        elem = elem.offsetParent;
    }
 
    return {top: top, left: left};
};

tabaga.getOffset = function(elem) {
    if (elem.getBoundingClientRect) {
        return tabaga.getOffsetRect(elem);
    } else {
        return tabaga.getOffsetSum(elem);
    }
};

tabaga.emptyFalseFn = function() {
	return false;
};

tabaga.stopEventPropagation = function(event) {
	if (!event) {
		// IE8
		window.event.cancelBubble = true;
	} else if (event.stopPropagation) {
		event.stopPropagation();
	}
};



tabaga.historyControlsMap = {};

/**
 * History call back. Load new content form server by AJAX.
 * 
 * @param anchor
 */
tabaga.pageload = function (hash) {
	for(var controlId in tabaga.historyControlsMap) {
		var control = tabaga.historyControlsMap[controlId];
		control.detectAnchor(hash);
	}
};

tabaga.enableHistoryControl = function(control, enable) {
	if (enable) {
		tabaga.historyControlsMap[control.id] = control;
		control.disableHistory = false;
	} else {
		delete tabaga.historyControlsMap[control.id];
		control.disableHistory = true;
	}
}

/**
 * Initialize and use browser history
 */
$(document).ready(function() {
	$.history.init(tabaga.pageload);
});

//
(function($) {
	/**
	 * var config = {
		urls: {
			feedChildNodesUrl: "pages/page",
			feedTreeScopeNodesUrl: "pages/pageTreeScope"
		},
	    enableDragAndDrop: true
	    //dragAndDropScrollContainer: null
	}
	 */
	$.fn.createTreeControl = function(id, config, rootNodes) {	
		var tree = $(this);
		
		config.TreeControlConstructor = config.TreeControlConstructor || tabaga.TreeControl;
		var treeControl = new config.TreeControlConstructor(id, tree[0]);
		treeControl.configure(config);
		treeControl.init(rootNodes);
		
		if (!config.disableHistory) {
			tabaga.historyControlsMap[id] = treeControl;
		}
		
		return treeControl;
	}
	
})(jQuery);
