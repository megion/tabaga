tabaga.ContextMenu = function(element, menuHtmlBuilderFn) {
	this.element = element;
	this.element.cm = this;
	this.menuHtmlBuilderFn = menuHtmlBuilderFn;
}

tabaga.ContextMenu.prototype.onCreate = function(container) {
	this.menuHtmlBuilderFn(container);
};

tabaga.DragObject.prototype.onRemove = function() {
};


