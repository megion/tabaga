/**
 * Критика:
 * 
 * Все это очень замечательно, но для действительно полноценного drag'n'drop'а
 * следует рассмотреть еще много-много интересного. Итак:
 * 
 * 1. Вы совершенно не учитываете возможность наличия других обработчиков
 * mousemove/mouseup, которые могут сделать stopPropagation/cancelBubble, и Ваш
 * drag'n'drop никогда не кончится. Во избежание этой ситуации обработчики
 * mousemove/mouseup следует навешивать С КАПЧУРИНГОМ на document:
 * document.addEventListener('mousemove', callback, true). В IE для тех же целей
 * необходимо установить setCapture на таскаемый элемент.
 * 
 * 2. Вы не учитываете возможность прерывания таскания, например, по alt+tab,
 * одновременному нажатию нескольких кнопок мыши или выходу курсора за пределы
 * документа.
 * 
 * 1) Попробовать предусмотреть такой нестандарт и не глюкануть сильно 2) Иметь
 * в виду, что пользователь, который так делает, обычно морально готов к глюкам.
 * 
 * А вот у IE с этим проблема (использую 6ую версию). Событие onmouseup ловится
 * за пределами окна только в том случае если нет обработчиков в стиле
 * document.body.onselectstart = funtion(e) {return false;}. Т.е. если работает
 * выделение и мы его не трогаем.
 * 
 * Поэтому для того чтобы, D&D корректно прекращался, а не продолжался после
 * того как кнопка была отпущена "за пределами", необходимо ловить
 * document.[body.]onmouseover и прекращать его если не нажать левая кнопка
 * мыши. Кстати у вас в примерах такой эффект присутствует. D&D продолжается
 * если отжать мышь за пределами ограничивающего контейнера.
 */
tabaga.dragMaster = (function() {
	var dragObject = null;

	/*
	 * хранит начальные координаты перемещаемого объекта, обнуляется после
	 * начала перемещения или если это был обычный click
	 */
	var mouseDownAt = null;
	var currentDropTarget = null;

	function mouseDown(e) {
		e = tabaga.fixEvent(e);
		if (e.which != 1) {
			return;
		}

		mouseDownAt = {
			x : e.pageX,
			y : e.pageY,
			element : this
		};
		addDocumentEventHandlers();
		return false;
	}

	function mouseMove(e) {
		e = tabaga.fixEvent(e);

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
				dragObject.onDragSuccess(currentDropTarget);
			} else {
				dragObject.onDragFail();
			}

			dragObject = null;
		}

		// (3)
		removeDocumentEventHandlers();
	}

	function getMouseOffset(target, x, y) {
		var docPos = tabaga.getOffset(target);
		return {
			x : x - docPos.left,
			y : y - docPos.top
		};
	}

	/**
	 * Иногда, например, при смене позиции элемента в списке, объект переносится
	 * не на акцептор, а между акцепторами. Как правило, "между" - имеется в
	 * виду по высоте.
	 * 
	 * Для этого логику определения currentDropTarget нужно поменять. Возможно
	 * два варианта:
	 * 
	 * Допустим перенос как между, так и над В этом случае акцептор делится на 3
	 * части по высоте clientHeight: 25% - 50% - 25%, и определяется попадание
	 * координаты события на нужную часть. Перенос только между Акцептор делится
	 * на две части: 50% - 50%
	 */
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
		}
	};
}());