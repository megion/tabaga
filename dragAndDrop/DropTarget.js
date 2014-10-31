/**
 * Обобщенный объект-акцептор, потенциальная цель переноса. Может быть большим
 * контейнером или маленьким элементом - не важно.
 * 
 * Поддерживаются вложенные DropTarget: объект будет положен туда, куда следует,
 * вне зависимости от степени вложенности.
 * 
 * @param element
 * @returns {DropTarget}
 */
tabaga.DropTarget = function(element) {
	element.dropTarget = this;
	this.element = element;
	this.position = null;
	this.state = null;
};

/**
 * Static constants
 */
tabaga.DropTarget.OVER = 1; // переместить над объектом
tabaga.DropTarget.INTO = 2; // переместить в объект 
tabaga.DropTarget.UNDER = 3; // переместить под объект

/**
 * Classes constants
 */
tabaga.DropTarget.ENTER_TARGET_CLASSES = {
	enter: "enterTarget",
	center: "enterCenterTarget",
	over: "enterOverTarget",
	under: "enterUnderTarget"
};
tabaga.DropTarget.ENTER_TARGET_ALL_CLASSES = [tabaga.DropTarget.ENTER_TARGET_CLASSES.enter,
                                              tabaga.DropTarget.ENTER_TARGET_CLASSES.center,
                                              tabaga.DropTarget.ENTER_TARGET_CLASSES.over,
                                              tabaga.DropTarget.ENTER_TARGET_CLASSES.under];

/**
 * При проносе объекта над DropTarget, dragMaster спросит у акцептора, может ли
 * он принять dragObject. Если нет - dragMaster проигнорирует этот акцептор.
 */
tabaga.DropTarget.prototype.canAccept = function(dragObject) {
	if (this.element == dragObject.element) {
		// запрет принимать объект в самого себя
		return false;
	}
	return true;
};

/**
 * Принимает переносимый объект. Объект может быть перемещен(в другой каталог)
 * или уничтожен(корзина) - зависит от вашей логики обработки переноса.
 */
tabaga.DropTarget.prototype.accept = function(dragObject) {
	dragObject.hide();
	dragObject.onDragSuccess(this);
	this.onLeave();
};

tabaga.DropTarget.prototype.onLeave = function() {
	tabaga.removeClasses(this.element, tabaga.DropTarget.ENTER_TARGET_ALL_CLASSES);
	this.state = null;
};

tabaga.DropTarget.prototype.onEnter = function() {
	var enterClasses = tabaga.DropTarget.ENTER_TARGET_CLASSES;
	tabaga.removeClasses(this.element, [enterClasses.over, enterClasses.under]);
	tabaga.addClasses(this.element, [enterClasses.enter, enterClasses.center]);

	this.state = null;
	this.position = tabaga.getOffset(this.element);
};

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
tabaga.DropTarget.prototype.onMove = function(x, y) {
	if (this.position) {
		// var offsetX = x - position.left;
		var offsetY = y - this.position.top;
		// определить какая из частей акцептора перекрыта
		var part = offsetY / this.element.clientHeight;
		var enterClasses = tabaga.DropTarget.ENTER_TARGET_CLASSES;
		if (part >= 0 && part < 0.5) {
			// элемент перемещается над объектом приемником
			tabaga.addClass(this.element, enterClasses.over);
			tabaga.removeClasses(this.element, [enterClasses.center, enterClasses.under]);
			this.state = tabaga.DropTarget.OVER;
		} else if (part>0.75) { 
			tabaga.addClass(this.element, enterClasses.under);
			tabaga.removeClasses(this.element, [enterClasses.center, enterClasses.over]);
			this.state = tabaga.DropTarget.UNDER;
		} else {
			// перемещение в объект приемника
			tabaga.addClass(this.element, enterClasses.center);
			tabaga.removeClasses(this.element, [enterClasses.under, enterClasses.over]);
			this.state = tabaga.DropTarget.INTO;
		}
	}
};

tabaga.DropTarget.prototype.toString = function() {
	return this.element.id;
};
