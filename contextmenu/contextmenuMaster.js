/**
 * Объект управляющий pop-up menu
 */
tabaga.contextmenuMaster = (function() {

	/*
	 * хранит информацию об всплывающем окне
	 */
	var lastContextMenu = null;
	
	
	function onShowContextMenu(e) {
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
		lastContextMenu = document.createElement("div");
		lastContextMenu.style.position = 'absolute';
		lastContextMenu.className = "contextMenu";
		
		lastContextMenu.style.top = y - mouseDownAt.y + 'px';
		lastContextMenu.style.left = x - mouseDownAt.x + 'px';
		
		var contextMenu = mouseDownAt.element.contextMenu
		contextMenu.onCreate(lastContextMenu);
		document.body.appendChild(lastContextMenu);
	}
	
	function closePopup(popup) {
		popup.popupWindow.style.display = "none";
		jQuery(popup.container).removeClass("opened-node");
		popup.open = false;
	}

	function renderPopup(popup) {
		if (lastPopup) {
			if (lastPopup.container == popup.container && lastPopup.open) {
				// закрыть и выйти
				closePopup(lastPopup);
				return;
			}
			
			// просто закрыть
			closePopup(lastPopup);
		}
		
		popup.popupWindow.style.display = "block";
		jQuery(popup.container).addClass("opened-node");
		popup.open = true;
	}
	

	function clickByDocument(event) {
		if (lastPopup==null || !lastPopup.open) {
	    	return;
	    }
		
		closePopup(lastPopup);

		// (3)
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