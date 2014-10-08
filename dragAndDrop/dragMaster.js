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
	var bodyCursorStyle = null;

	function initDrag(x, y, el) {
		mouseDownAt = {
			x : x,
			y : y,
			element : el
		};
		addDocumentEventHandlers();

		// save cursor style
		bodyCursorStyle = document.body.style.cursor;
		document.body.style.cursor = "pointer";
	}
	
	function moveDrag(x, y) {
		

		// Начать перенос
		var elem = mouseDownAt.element;
		// текущий объект для переноса
		dragObject = elem.dragObject;

		// запомнить, с каких относительных координат начался перенос
		var mouseOffset = {x: 0, y: 0};//getMouseOffset(elem, 0, 0);
		//mouseDownAt = null; // запомненное значение больше не нужно, сдвиг
		// уже вычислен

		dragObject.onDragStart(mouseOffset); // начали
	}

	function mouseDown(e) {
		e = tabaga.fixEvent(e);
		if (e.which != 1) {
			return;
		}

		initDrag(e.pageX, e.pageY, this);

		return false;
	}

	function mouseMove(e) {
		e = tabaga.fixEvent(e);
		console.log("move: " + e);

		// (1)
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

		// (2)
		dragObject.onDragMove(e.pageX, e.pageY);

		// (3)
		var newTarget = getCurrentTarget(e);

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
			currentDropTarget.onMove(e.pageX, e.pageY);
		}

		// (6)
		return false;
	}

	function mouseUp() {
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

		// (4) восстанавливаем стиль курсора
		document.body.style.cursor = bodyCursorStyle;
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
		emulateDragStart : function(x, y, element) {
			initDrag(x, y, element);
			//moveDrag(x, y);
			//movingDragObject(x, y, false);
		}

	};
}());