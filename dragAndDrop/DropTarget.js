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

	this.rememberClassName = null;
	this.position = null;
};

/**
 * При проносе объекта над DropTarget, dragMaster спросит у акцептора, может ли
 * он принять dragObject. Если нет - dragMaster проигнорирует этот акцептор.
 */
tabaga.DropTarget.prototype.canAccept = function(dragObject) {
	if (this.element.id == dragObject.getId()) {
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
	this.onLeave();

	dragObject.hide();

	alert("Акцептор '" + this + "': принял объект '" + dragObject + "'");
};

tabaga.DropTarget.prototype.onLeave = function() {
	this.element.className = rememberClassName;
};

tabaga.DropTarget.prototype.onEnter = function() {
	if (this.element.className) {
		this.rememberClassName = this.element.className;
		this.element.className = this.rememberClassName
				+ ' enterTarget enterCenterTarget';
	}

	this.position = tabaga.getOffset(element);
};

tabaga.DropTarget.prototype.onMove = function(x, y) {
	if (this.position) {
		// var offsetX = x - position.left;
		var offsetY = y - this.position.top;
		// определить какая из частей акцептора перекрыта
		var part = offsetY / this.element.clientHeight;
		// log("calculate part: " + part);

		if (part >= 0 && part < 0.5) {
			// элемент перемещается над объектом приемником
			this.element.className = this.rememberClassName
					+ ' enterTarget enterOverTarget';
		} /*
			 * else if (part>0.75) { element.className = rememberClassName + '
			 * enterTarget enterUnderTarget'; }
			 */
		else {
			// перемещение в объект приемника
			this.element.className = this.rememberClassName
					+ ' enterTarget enterCenterTarget';
		}
	}
};

tabaga.DropTarget.prototype.toString = function() {
	return this.element.id;
};
