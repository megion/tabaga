/**
 * 
 * @param container
 *            элемент полосой прокруткой которого необходимо управлять
 */
tabaga.DragScrollManager = function(container) {
	this.rememberBound = null;
	this.managedContainer = container;
}

tabaga.DragScrollManager.prototype.onDragStart = function() {
	var containerOffset = tabaga.getOffset(this.managedContainer);
	this.rememberBound = {
		minY : containerOffset.top,
		minX : containerOffset.left,
		maxY : containerOffset.top + this.managedContainer.clientHeight,
		maxX : containerOffset.left + this.managedContainer.clientWidth
	};
};

tabaga.DragScrollManager.prototype.onDragMove = function(x, y) {
	if (y >= this.rememberBound.maxY) {
		// курсор находится внизу контейнера
		if ((this.managedContainer.scrollTop + this.managedContainer.clientHeight) < this.managedContainer.scrollHeight) {
			this.managedContainer.scrollTop = this.managedContainer.scrollTop + 10;
		}
	} else if (y <= this.rememberBound.minY) {
		// курсор находится у верхней границы элемента контейнера
		if (this.managedContainer.scrollTop > 0) {
			// необходимо прокрутить вверх
			this.managedContainer.scrollTop = this.managedContainer.scrollTop - 10;
		}
	}
};
