tabaga.ModalCreator = function(title, okCallback) {
	this.title = title;
	this.okCallback = okCallback;
}

tabaga.ModalCreator.prototype.createHeader = function(modalWindow, title) {
	var a = document.createElement("a");
	a.className = "modalWindow-header-close";
	a.onclick = tabaga.modalMaster.closeModal;
	modalWindow.appendChild(a);
	
	var h = document.createElement("div");
	h.className = "modalWindow-header";
	modalWindow.appendChild(h);
	h.appendChild(document.createTextNode(title));
	
	return h;
}

tabaga.ModalCreator.prototype.createBody = function(modalWindow) {
	var b = document.createElement("div");
	b.className = "modalWindow-body";
	modalWindow.appendChild(b);
	
	return b;
}

tabaga.ModalCreator.prototype.createFooter = function(modalWindow) {
	var f = document.createElement("div");
	f.className = "modalWindow-footer";
	modalWindow.appendChild(f);
	
	return f;
}

tabaga.ModalCreator.prototype.onCreate = function(modalWindow) {
	this.createHeader(modalWindow, this.title);
	this.createBody(modalWindow);
	this.createFooter(modalWindow);
};

tabaga.ModalCreator.prototype.onDestroy = function(modalWindow) {
};


