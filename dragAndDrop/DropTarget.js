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

	//this.rememberClassName = null;
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
tabaga.DropTarget.ENTER_TARGET_CLASS = "enterTarget";
tabaga.DropTarget.ENTER_CENTER_TARGET_CLASS = "enterCenterTarget";
tabaga.DropTarget.ENTER_OVER_TARGET_CLASS = "enterOverTarget";
tabaga.DropTarget.ENTER_UNDER_TARGET_CLASS = "enterUnderTarget";
tabaga.DropTarget.ENTER_TARGET_ALL_CLASSES = [tabaga.DropTarget.ENTER_TARGET_CLASS,
                                              tabaga.DropTarget.ENTER_CENTER_TARGET_CLASS,
                                              tabaga.DropTarget.ENTER_OVER_TARGET_CLASS,
                                              tabaga.DropTarget.ENTER_UNDER_TARGET_CLASS];

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
	console.log("onLeave " + this.element.innerHTML + ", class: "  + this.element.getAttribute("class"));
	//if (this.rememberClassName) {
	//	this.element.className = this.rememberClassName;
	//}
	tabaga.removeClasses(this.element, tabaga.DropTarget.ENTER_TARGET_ALL_CLASSES);
	//this.updateClassName('');
	//$(this.element).removeClass("enterTarget enterCenterTarget enterOverTarget enterUnderTarget");
	//this.rememberClassName = null;
	//console.log("set rememberClassName to null: " + this.rememberClassName + " "  + this.element.innerHtml);
	this.state = null;
};

tabaga.DropTarget.prototype.onEnter = function() {
	//this.rememberClassName = null;
	var className = this.element.getAttribute("class");
	console.log("onEnter " + this.element.innerHTML + ", class: "  + className);
	//if (className) {
		//this.rememberClassName = className;
		//console.log("set rememberClassName: " + this.rememberClassName + " "  + this.element.innerHTML);
		//console.log("set rememberClassName2: " + this.element.getAttribute("class") + " "  + this.element.innerHTML);
	//}
	tabaga.addClasses(this.element, [tabaga.DropTarget.ENTER_TARGET_CLASS, tabaga.DropTarget.ENTER_CENTER_TARGET_CLASS]);
	tabaga.removeClasses(this.element, [tabaga.DropTarget.ENTER_OVER_TARGET_CLASS, tabaga.DropTarget.ENTER_UNDER_TARGET_CLASS]);
	//this.updateClassName('enterTarget enterCenterTarget');
	//$(this.element).addClass("enterTarget enterCenterTarget");

	this.state = null;
	this.position = tabaga.getOffset(this.element);
};

tabaga.DropTarget.prototype.updateClassName = function(className) {
	if (this.rememberClassName) {
		this.element.setAttribute("class", this.rememberClassName + " " + className);
		//console.log("set class1: " + this.element.className + " "  + this.element.innerHTML);
	} else {
		this.element.setAttribute("class", className);
		//console.log("set class2: " + this.element.className + " "  + this.element.innerHTML);
	}
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
tabaga.DropTarget.prototype.onMove = function(x, y) {
	if (this.position) {
		// var offsetX = x - position.left;
		var offsetY = y - this.position.top;
		// определить какая из частей акцептора перекрыта
		var part = offsetY / this.element.clientHeight;
		//console.log("calculate part: " + part);

		if (part >= 0 && part < 0.5) {
			// элемент перемещается над объектом приемником
			//this.element.className = this.rememberClassName
					//+ ' enterTarget enterOverTarget';
			tabaga.addClass(this.element, tabaga.DropTarget.ENTER_OVER_TARGET_CLASS);
			tabaga.removeClasses(this.element, [tabaga.DropTarget.ENTER_CENTER_TARGET_CLASS, tabaga.DropTarget.ENTER_UNDER_TARGET_CLASS]);
			//this.updateClassName('enterTarget enterOverTarget');
			//$(this.element).addClass("enterTarget enterOverTarget");
			
			this.state = tabaga.DropTarget.OVER;
		} else if (part>0.75) { 
			//this.element.className = this.rememberClassName + ' enterTarget enterUnderTarget';
			//this.updateClassName('enterTarget enterUnderTarget');
			//$(this.element).addClass("enterTarget enterUnderTarget");
			tabaga.addClass(this.element, tabaga.DropTarget.ENTER_UNDER_TARGET_CLASS);
			tabaga.removeClasses(this.element, [tabaga.DropTarget.ENTER_CENTER_TARGET_CLASS, tabaga.DropTarget.ENTER_OVER_TARGET_CLASS]);
			this.state = tabaga.DropTarget.UNDER;
		} else {
			// перемещение в объект приемника
			//this.element.className = this.rememberClassName
					//+ ' enterTarget enterCenterTarget';
			//this.updateClassName('enterTarget enterCenterTarget');
			//$(this.element).addClass("enterTarget enterCenterTarget");
			tabaga.addClass(this.element, tabaga.DropTarget.ENTER_CENTER_TARGET_CLASS);
			tabaga.removeClasses(this.element, [tabaga.DropTarget.ENTER_UNDER_TARGET_CLASS, tabaga.DropTarget.ENTER_OVER_TARGET_CLASS]);
			this.state = tabaga.DropTarget.INTO;
		}
	}
};

tabaga.DropTarget.prototype.toString = function() {
	return this.element.id;
};
