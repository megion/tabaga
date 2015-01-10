/**
 * Класс элемента дерева
 * 
 * @param treeId -
 *            ID дерева
 */
tabaga.AbstractTreeControl = function(id, treeEl) {
	this.id = id;
	this.treeEl = treeEl;
	this.treeEl.treeControl = this;
	this.currentSelectedNodeEl = null;
	this.allNodesMap = {};
};

/**
 * Static tree class name constants
 */
tabaga.AbstractTreeControl.TREE_CLASSES = {
	selectedNode : "selected",
	treeNode : "menu",
	closed : "closed",
	closedHitarea : "closed-hitarea",
	lastClosed : "lastClosed",
	lastClosedHitarea : "lastClosed-hitarea",
	opened : "opened",
	openedHitarea : "opened-hitarea",
	lastOpened : "lastOpened",
	lastOpenedHitarea : "lastOpened-hitarea",
	hitarea : "hitarea"
};

/**
 * Обработчик события выделения узла дерева. Функция объявлена как константа
 */
tabaga.AbstractTreeControl.onClickTreeNode = function(event) {
	tabaga.stopEventPropagation(event);

	var nodeEl = this; // т.к. событие на узле Li
	var treeControl = nodeEl.treeControl;
	treeControl.clickNode(nodeEl);
	return false;
};

/**
 * Установка конфигурации дерева
 */
tabaga.AbstractTreeControl.prototype.configure = function(config) {
	this.conf = config || {};
	this.disableHistory = this.conf.disableHistory;
}

tabaga.AbstractTreeControl.prototype.clickNode = function(nodeEl, setClosed) {
	if (setClosed==undefined || setClosed==null) {
		setClosed = (nodeEl.opened==null?false:nodeEl.opened);
	}
	if (this.disableHistory) {
		this.selectTreeNode(nodeEl, setClosed);
	} else {
		nodeEl.opened = !setClosed;
		var hash = this.getNodeHash(nodeEl);
		
		var curAnchor = decodeURIComponent(location.hash.slice(1));
		var newAnchor = tabaga.historyMaster.putValue(this.id, hash, curAnchor);
		jQuery.history.load(newAnchor);
		// выделение узла в данном случае осуществляет callback history 
	}
};

tabaga.AbstractTreeControl.prototype.processAllNodes = function(processorFn) {
	for(var nodeId in this.allNodesMap) {
		var nodeModel = this.allNodesMap[nodeId];
		var nodeEl = nodeModel.nodeEl;
		processorFn.call(this, nodeEl);
	}
};

/**
 * Загружает данные модели с сервера в виде JSON
 * 
 * @param nodeElHtml -
 *            обновляемый узел
 */
tabaga.AbstractTreeControl.prototype.loadChildNodes = function(nodeEl) {
	console.error("Function loadChildNodes should be overriden");
};

/**
 * Загружает данные модели с сервера в виде JSON
 * 
 * @param nodeElHtml -
 *            обновляемый узел
 */
tabaga.AbstractTreeControl.prototype.loadTreeScopeNodes = function(nodeId, setClosed, updateCloseState) {
	console.error("Function loadTreeScopeNodes should be overriden");
};

/**
 * Установить видимость выделения узла
 */
tabaga.AbstractTreeControl.prototype.setSelectionTreeNode = function(nodeEl) {
	console.error("Function setSelectionTreeNode should be overriden");
};

tabaga.AbstractTreeControl.prototype.processAllParentNode = function(nodeEl, processNodeFn) {
	console.error("Function processAllParentNode should be overriden");
};

/**
 * Выделение узла дерева
 * 
 * @param nodeElHtml
 */
tabaga.AbstractTreeControl.prototype.selectTreeNode = function(nodeEl, setClosed) {
	this.setSelectionTreeNode(nodeEl);
	this.setNodeClose(nodeEl, setClosed);
	
	var requireLoading = nodeEl.nodeModel.needLoad;
	if (requireLoading) {
		this.loadChildNodes(nodeEl);
	}
};

tabaga.AbstractTreeControl.prototype.setNodeClose = function(nodeEl, closed) {
	var CLASSES = tabaga.AbstractTreeControl.TREE_CLASSES;
	var hasChildren = nodeEl.nodeModel.hasChildren;
	
	// mark node as closed or opened
	nodeEl.opened = !closed;
	
	if (!hasChildren) {
		return;
	}

	var isLast = nodeEl.nodeModel.isLast; 
	if (isLast) {
		if (closed) {
			tabaga.addClass(nodeEl, CLASSES.lastClosed);
			tabaga.removeClass(nodeEl, CLASSES.lastOpened);
		} else {
			tabaga.addClass(nodeEl, CLASSES.lastOpened);
			tabaga.removeClass(nodeEl, CLASSES.lastClosed);
		}
	}

	if (closed) {
	    tabaga.addClass(nodeEl, CLASSES.closed);
	    tabaga.removeClass(nodeEl, CLASSES.opened);
	} else {
		tabaga.addClass(nodeEl, CLASSES.opened);
	    tabaga.removeClass(nodeEl, CLASSES.closed);
	}
	
	// override ...
};

tabaga.AbstractTreeControl.prototype.openNode = function(nodeEl, setClosed) {
	// open parent nodes
	this.processAllParentNode(nodeEl, function(parentNodeEl) {
		if (!parentNodeEl.opened) {
			this.setNodeClose(parentNodeEl, false);
		}
	});
	this.selectTreeNode(nodeEl, setClosed);
};

/**
 * Сформировать хеш для подстановки в URL для последующего восстановления
 * состояния страницы
 * 
 * @param nodeElHtml
 * @returns {String}
 */
tabaga.AbstractTreeControl.prototype.getNodeHash = function(nodeEl) {
	var nodeId = nodeEl.nodeModel.id;
	if (nodeEl.opened!=null && !nodeEl.opened) {
		nodeId = nodeId + "&state=closed";
	}
	return "id-" + nodeId;
};

tabaga.AbstractTreeControl.prototype.getNodeInfoByAnchor = function(anchor) {
	var parts = anchor.split('&');
	var path = parts.shift();
	var setClosed = false;
	if (parts.length) {
		var param = parts.shift();
		if (param == 'state=closed') {
			setClosed = true;
		}
	}
	var nodeId = path.substring(path.indexOf("-") + 1, path.length);
	var info =  {
		nodeId: nodeId,
		setClosed: setClosed
	};
	return info;
};

tabaga.AbstractTreeControl.prototype.detectAnchor = function(anchor) {
	if (anchor) {
		this.updateTreeStateByAnchor(anchor, false);
	}
};

tabaga.AbstractTreeControl.prototype.updateTreeStateByAnchor = function(anchor, updateCloseState) {
	var treeHash = tabaga.historyMaster.getValue(this.id, decodeURIComponent(anchor));
	if (!treeHash) {
		return;
	}
	var nodeInfo = this.getNodeInfoByAnchor(treeHash);
	var nodeModel = this.allNodesMap[nodeInfo.nodeId];
	if (nodeModel && !nodeModel.fakeNode) {
		this.openNode(nodeModel.nodeEl, nodeInfo.setClosed);
	} else {
		this.loadTreeScopeNodes(nodeInfo.nodeId, nodeInfo.setClosed, updateCloseState);
	}
};

tabaga.AbstractTreeControl.prototype.updateState = function() {
	var anchor = location.hash.slice(1);
	this.updateTreeStateByAnchor(anchor, true);
};

tabaga.AbstractTreeControl.prototype.removeState = function() {
	if (!this.disableHistory) {
		var curAnchor = decodeURIComponent(location.hash.slice(1));
		var newAnchor = tabaga.historyMaster.removeValue(this.id, curAnchor);
		jQuery.history.load(newAnchor);
		// снятие выделение узла в данном случае осуществляет callback history 
	}
};

