/**
 * Объект управляющий pop-up menu
 */
tabaga.popupMaster = (function() {
	var contextMenuContainer = null;
	var mouseDownAt = null;
	var hasover = false;
	
	function contextMenu(e) {
		tabaga.stopEventPropagation(e);
		e = tabaga.fixEvent(e);
		
		closeContextMenu();

		mouseDownAt = {
			x : e.pageX,
			y : e.pageY,
			element : this
		};
	
		createContextMenu();	
		return false;
	}
	
	function createContextMenu() {
		var popupmenu = mouseDownAt.element.popupMenu;
		
		contextMenuContainer = document.createElement("div");
		contextMenuContainer.className = "contextMenuContainer";
		
		contextMenuContainer.style.top = mouseDownAt.y + 'px';
		contextMenuContainer.style.left = mouseDownAt.x + 'px';
		
		contextMenuContainer.oncontextmenu = tabaga.emptyFalseFn;
		contextMenuContainer.onmouseleave = mouseoutContextMenuContainer;
		contextMenuContainer.onmouseenter = mouseoverContextMenuContainer;
		
		popupmenu.onCreate(contextMenuContainer);
		if (popupmenu.appendToElement) {
			popupmenu.appendToElement.appendChild(contextMenuContainer);
		} else {
			document.body.appendChild(contextMenuContainer);
		}
	}
	
	function closeContextMenu() {
		if (!mouseDownAt) {
			return;
		}
		var popupmenu = mouseDownAt.element.popupMenu;
		popupmenu.onRemove(contextMenuContainer);
		if (popupmenu.appendToElement) {
			contextMenuContainer.parentNode.removeChild(contextMenuContainer);
		} else {
			document.body.removeChild(contextMenuContainer);
		}
		mouseDownAt = null;
		contextMenuContainer = null;
	    hasover = false;
	}

	function clickByDocument(event) {
		if (event.which != 1) {
			return;
	    }
		closeContextMenu();
	}
	
	function mouseoutContextMenuContainer(event) {
		//var self = this;
		setTimeout(function() {
			if (!hasover) {
				closeContextMenu();
			}
		}, 2000 );
		hasover = false;
	}
	
	function mouseoverContextMenuContainer(event) {
		hasover = true;
	}

	return {
		makeContextable : function(element) {
			element.oncontextmenu = contextMenu;
		},
		closeContext : function() {
			closeContextMenu();
		}
	};
}());