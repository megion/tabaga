/**
 * Объект управляющий pop-up menu
 */
tabaga.contextmenuMaster = (function() {
	var menuContainer = null;
	
	function onShowContextMenu(e) {
		tabaga.stopEventPropagation(e);
		e = tabaga.fixEvent(e);
		//if (e.which != 3) {
			//return;
		//}

		var mouseDownAt = {
			x : e.pageX,
			y : e.pageY,
			element : this
		};
		addDocumentEventHandlers();
		
		createContextMenu(mouseDownAt);
		
		return false;
	}
	
	function createContextMenu(mouseDownAt) {
		closeContextMenu();
		
		menuContainer = document.createElement("div");
		menuContainer.style.position = 'absolute';
		menuContainer.className = "contextMenu";
		
		menuContainer.style.top = mouseDownAt.y + 'px';
		menuContainer.style.left = mouseDownAt.x + 'px';
		
		var cm = mouseDownAt.element.cm;
		cm.onCreate(menuContainer);
		document.body.appendChild(menuContainer);
	}
	
	function closeContextMenu() {
		if (!menuContainer) {
			return;
		}
		
		document.body.removeChild(menuContainer);
		menuContainer = false;
	}

	function clickByDocument(event) {
		if (event.which != 1) {
			return;
	    }
		closeContextMenu();
		removeDocumentEventHandlers();
	}

	function addDocumentEventHandlers() {
		document.onclick = clickByDocument;
		document.ondragstart = document.body.onselectstart = tabaga.emptyFalseFn;
	}
	function removeDocumentEventHandlers() {
		document.onclick = document.ondragstart = document.body.onselectstart = null;
	}

	return {
		makeContextable : function(element) {
			element.oncontextmenu = onShowContextMenu;
		}
	};
}());