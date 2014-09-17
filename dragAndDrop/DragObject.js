tabaga.DragObject = function(element, scrollContainer) {
	this.element = element;
	this.element.dragObject = this;

	this.dragScrollContainer = null;
	if (scrollContainer) {
		this.dragScrollContainer = new tabaga.DragScrollContainer(
				scrollContainer);
	}

	tabaga.dragMaster.makeDraggable(this.element);

	// var rememberPosition = null;
	this.mouseOffset = null;
	this.objectClone = null;
}

/**
 * В текущей реализации отрывает объект "от земли" и запоминает текущую позицию
 * в rememberPosition и сдвиг курсора мыши от левого-верхнего угла объекта в
 * mouseOffset.
 * 
 * В другой реализации может показывать перенос как-то по-другому, например
 * создавать "переносимый клон" объекта.
 */
tabaga.DragObject.prototype.onDragStart = function(offset) {
	this.objectClone = document.createElement("span");
	this.objectClone.innerHTML = this.element.innerHTML;
	this.objectClone.style.position = 'absolute';
	this.objectClone.className = "dragObjectClone";
	document.body.appendChild(this.objectClone);
	
	if (this.dragScrollContainer) {
		this.dragScrollContainer.onDragStart();
	}

	this.mouseOffset = offset;
};

tabaga.DragObject.prototype.hide = function() {
	this.objectClone.style.visibility = 'hidden';
};

tabaga.DragObject.prototype.show = function() {
	this.objectClone.style.visibility = 'visible';
};

tabaga.DragObject.prototype.onDragMove = function(x, y) {
	// element.style.top = y - mouseOffset.y + 'px';
	// element.style.left = x - mouseOffset.x + 'px';

	this.objectClone.style.top = y - this.mouseOffset.y + 'px';
	this.objectClone.style.left = x - this.mouseOffset.x + 'px';

	if (this.dragScrollContainer) {
		this.dragScrollContainer.onDragMove(x, y);
	}

	// container.scrollTop = container.scrollTop - (x - startX);
	// container.scrollLeft=container.scrollLeft + (y-startY);
};

tabaga.DragObject.prototype.onDragSuccess = function(dropTarget) {
};

tabaga.DragObject.prototype.onDragFail = function() {
	// var s = element.style;
	// s.top = rememberPosition.top;
	// s.left = rememberPosition.left;
	// s.position = rememberPosition.position;
	document.body.removeChild(this.objectClone);
	this.objectClone = null;
};
