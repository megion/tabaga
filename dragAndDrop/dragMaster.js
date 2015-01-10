/**
 * 
 */
tabaga.dragMaster = (function() {
	var dragObject = null;

	/*
	 * хранит начальные координаты перемещаемого объекта, обнуляется после
	 * начала перемещения или если это был обычный click
	 */
	var mouseDownAt = null;
	var currentDropTarget = null;

	function initDrag(x, y, el) {
		mouseDownAt = {
			x : x,
			y : y,
			element : el
		};
		addDocumentEventHandlers();

		// save cursor style
		tabaga.addClass(document.body, "dragstart");
	}

	function mouseDown(e) {
		e = tabaga.fixEvent(e);
		if (e.which != 1) {
			return;
		}

		initDrag(e.pageX, e.pageY, this);

		return false;
	}
	
	function mouseMoveEmulate(e) {
		e = tabaga.fixEvent(e);

		if (mouseDownAt) {
			// Начать перенос
			var elem = mouseDownAt.element;
			// текущий объект для переноса
			dragObject = elem.dragObject;

			dragObject.onDragStart({x: mouseDownAt.x, y: mouseDownAt.y}); // начали
			
			mouseDownAt = null; // запомненное значение больше не нужно, сдвиг
			// уже вычислен
		}

		moving(e);
		return false;
	}
	
	function moving(fixedEvent) {
		// (2)
		dragObject.onDragMove(fixedEvent.pageX, fixedEvent.pageY);

		// (3)
		var newTarget = getCurrentTarget(fixedEvent);

		// (4)
		if (currentDropTarget != newTarget) {
			if (currentDropTarget) {
				currentDropTarget.onLeave();
			}
			if (newTarget) {
				newTarget.onEnter();
			}
			currentDropTarget = newTarget;
		}

		// (5) перемещение над акцептором
		if (currentDropTarget) {
			currentDropTarget.onMove(fixedEvent.pageX, fixedEvent.pageY);
		}
	}

	function mouseMove(e) {
		e = tabaga.fixEvent(e);

		if (mouseDownAt) {
			if (Math.abs(mouseDownAt.x - e.pageX) < 5
					&& Math.abs(mouseDownAt.y - e.pageY) < 5) {
				return false;
			}

			// Начать перенос
			var elem = mouseDownAt.element;
			// текущий объект для переноса
			dragObject = elem.dragObject;

			// запомнить, с каких относительных координат начался перенос
			var mouseOffset = getMouseOffset(elem, mouseDownAt.x, mouseDownAt.y);
			mouseDownAt = null; // запомненное значение больше не нужно, сдвиг
			// уже вычислен

			dragObject.onDragStart(mouseOffset); // начали
		}
		
		moving(e);
		return false;
	}

	function mouseUp(e) {
		if (!dragObject) { // (1)
			mouseDownAt = null;
		} else {
			// (2)
			if (currentDropTarget) {
				currentDropTarget.accept(dragObject);
			} else {
				dragObject.onDragFail();
			}

			dragObject = null;
		}

		// (3)
		removeDocumentEventHandlers();

		// (4) восстанавливаем стиль body
		tabaga.removeClass(document.body, "dragstart");
	}

	function getMouseOffset(target, x, y) {
		var docPos = tabaga.getOffset(target);
		return {
			x : x - docPos.left,
			y : y - docPos.top
		};
	}

	function getCurrentTarget(e) {
		// спрятать объект, получить элемент под ним - и тут же показать опять
		var x, y;
		if (navigator.userAgent.match('MSIE')
				|| navigator.userAgent.match('Gecko')) {
			x = e.clientX;
			y = e.clientY;
		} else {
			x = e.pageX, y = e.pageY;
		}
		// чтобы не было заметно мигание - максимально снизим время от hide до
		// show
		dragObject.hide();
		var elem = document.elementFromPoint(x, y);
		dragObject.show();

		// найти самую вложенную dropTarget
		while (elem) {
			// которая может принять dragObject
			if (elem.dropTarget && elem.dropTarget.canAccept(dragObject)) {
				// log("find dropTarget: " + elem.dropTarget.toString());
				return elem.dropTarget;
			}
			elem = elem.parentNode;
		}

		// dropTarget не нашли
		return null;
	}

	function addDocumentEventHandlers() {
		document.onmousemove = mouseMove;
		document.onmouseup = mouseUp;
		document.ondragstart = document.body.onselectstart = tabaga.emptyFalseFn;
	}
	function removeDocumentEventHandlers() {
		document.onmousemove = document.onmouseup = document.ondragstart = document.body.onselectstart = null;
	}

	return {
		makeDraggable : function(element) {
			element.onmousedown = mouseDown;
		},
		makeUnDraggable : function(element) {
			element.onmousedown = null;
		},
		emulateDragStart : function(element, offset) {
			initDrag(offset.x, offset.y, element);
			document.onmousemove = mouseMoveEmulate;
		}
	};
}());