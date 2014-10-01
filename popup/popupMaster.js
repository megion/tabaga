/**
 * Объект управляющий pop-up menu
 */
tabaga.popupMaster = (function() {
	var contextMenuContainer = null;
	var mouseDownAt = null;
	
	function contextMenu(e) {
		tabaga.stopEventPropagation(e);
		e = tabaga.fixEvent(e);
		//if (e.which != 3) {
			//return;
		//}

		mouseDownAt = {
			x : e.pageX,
			y : e.pageY,
			element : this
		};
	
		createContextMenu();	
		return false;
	}
	
	function createContextMenu() {
		// удалем старый контейнер с контекстным меню, если он уже был
		if (contextMenuContainer) {
			document.body.removeChild(contextMenuContainer);
			contextMenuContainer = null;
		}
		
		contextMenuContainer = document.createElement("div");
		//contextMenuContainer.style.position = 'absolute';
		contextMenuContainer.className = "contextMenuContainer";
		
		contextMenuContainer.style.top = mouseDownAt.y + 'px';
		contextMenuContainer.style.left = mouseDownAt.x + 'px';
		
		var popupmenu = mouseDownAt.element.popupMenu;
		popupmenu.onCreate(contextMenuContainer);
		document.body.appendChild(contextMenuContainer);
		
		addDocumentEventHandlers();
	}
	
	function closeContextMenu() {
		var popupmenu = mouseDownAt.element.popupMenu;
		popupmenu.onRemove(contextMenuContainer);
		document.body.removeChild(contextMenuContainer);
		mouseDownAt = null;
		contextMenuContainer = null;
		removeDocumentEventHandlers();
	}

	function clickByDocument(event) {
		//if (event.which != 1) {
			//return;
	    //}
		closeContextMenu();
		
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
			element.oncontextmenu = contextMenu;
		}
	};
}());