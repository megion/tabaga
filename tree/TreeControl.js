


tabaga.loadHistory = function (hash) {
	// Logger.append('[load history] hash=' + hash);
	$.history.load(hash);
};

/**
 * Обработчик события выделения узла дерева
 */
tabaga.onSelectTreeNode = function(event) {
	// IE

	if ($.browser.msie) {
		window.event.cancelBubble = true;
	}
	if (event.stopPropagation) {
		event.stopPropagation();
	}

	var treeControl = this.treeControl;
	var setClosed = (this.opened==null?false:this.opened);
	this.opened = !setClosed;
	var nodeHash = treeControl.getNodeHash(this);
	tabaga.loadHistory(nodeHash);
	//treeControl.selectTreeNode(this, true, false, setClosed);
	//alert("Li selected: " + this.id);

	return false;
};



/**
 * History call back. Load new content form server by AJAX.
 * 
 * @param anchor
 */
tabaga.pageload = function (hash) {
	var treeUl = document.getElementById("treePages");
	var treeControl = treeUl.tree;
	treeControl.detectAnchor(hash);
};

/**
 * Initialize and use browser history
 */
$(document).ready(function() {
	//if ($.browser.msie && $.browser.version == 8) {
		// Logger.append('You are using IE8 in version ' + document.documentMode
		// + ' compatible mode.');
	//}
	// Logger.append('The plugin is running in ' + $.history.type + ' mode.');
	$.history.init(tabaga.pageload);
});

/**
 * Предопределенные CSS классы для дерева
 */
tabaga.LINE_TREE_CLASSES = {
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
 * Класс элемента дерева
 * 
 * @param treeId -
 *            ID дерева
 * @param feedChildNodesUrl -
 *            относительный URL сервера для обновления ветки дерева
 */
tabaga.TreeControl = function(id, treeUl) {
	this.id = id;
	this.treeUl = treeUl;
	this.currentSelectedTreeNodeSpan = null;
	this.allNodesMap = {};
};

/**
 * Установка конфигурации дерева
 */
tabaga.TreeControl.prototype.configure = function(config) {
	var conf = config || {};
	
	this.feedChildNodesUrl = conf.urls.feedChildNodesUrl;
	this.feedTreeScopeNodesUrl = conf.urls.feedTreeScopeNodesUrl;
	this.enableDragAndDrop = conf.enableDragAndDrop;
	if (this.enableDragAndDrop) {
		// default scroll container
		this.dragAndDropScrollContainer = conf.dragAndDropScrollContainer || this.treeUl.parentNode;
	}
	
	// callback events
	this.onStartFeedChildNodes = conf.onStartFeedChildNodes;
	this.onSuccessFeedChildNodes = conf.onSuccessFeedChildNodes;
	this.onStartFeedTreeScopeNodes = conf.onStartFeedTreeScopeNodes;
	this.onSuccessFeedTreeScopeNodes = conf.onSuccessFeedTreeScopeNodes;
}

/**
 * Начальная инициализация дерева
 */
tabaga.TreeControl.prototype.init = function(rootNodes) {
	
	this.treeUl.tree = this; // use only for history. need refactoring
	this.appendNewNodes(this.treeUl, rootNodes);
};

tabaga.TreeControl.prototype.setDragAndDropScrollContainer = function(dragAndDropScrollContainer) {
	this.dragAndDropScrollContainer = dragAndDropScrollContainer;
};

/**
 * Получает массив моделей узлов содержащихся в UL контейнере
 */
tabaga.TreeControl.prototype.getNodeModelsByUlContainer = function(ulContainer) {
	var nodes = [];
	for ( var i = 0; ulContainer.childNodes[i]; i++) {
		var child = ulContainer.childNodes[i];
		if (child.nodeName.toLowerCase() == "li") {
			nodes.push(child.nodeModel);
		}
	}
	
	console.log("get nodes: " + nodes);
	return nodes;
}

/**
 * Обновляет содержимое существующего контейнера узлов UL
 */
tabaga.TreeControl.prototype.updateExistUlNodesContainer = function(
		ulContainer, newNodes) {
	var oldNodes = null;
	if (ulContainer) { 
		oldNodes = this.getNodeModelsByUlContainer(ulContainer);
	}
	
	if (oldNodes == null) {
		//console.error("Old nodes must not be null");
	}

	// новых узлов нет
	if (newNodes == null || newNodes.length == 0) {
		// данный код сработает только для узлов самого верхнего уровня т.к. для
		// дочерних узлов сработают проверки в updateExistNode.
		// если есть старые узлы то их все необходимо удалить и выйти
		if (oldNodes != null && oldNodes.length > 0) {
			for ( var i = 0; i < oldNodes.length; i++) {
				var oldnode = oldNodes[i];
				this.deleteExistSubNode(ulContainer, oldnode);
			}
		}
		return;
	}

	// подготовить new nodes HashMaps (key->nodeId, value->node)
	var newNodesByKey = new Object();
	for ( var i = 0; i < newNodes.length; i++) {
		var newNode = newNodes[i];
		newNodesByKey[newNode.id] = newNode;
	}

	// подготовить old nodes HashMaps (key->nodeId, value->node), который будет
	// содержать только не удаленные узлы. В этом же цикле удалить узлы которых
	// нет в новом наборе узлов
	var oldNodesByKey = new Object();
	for ( var i = 0; i < oldNodes.length; i++) {
		var oldNode = oldNodes[i];
		if (newNodesByKey[oldNode.id] == null) {
			// узел был удален
			this.deleteExistSubNode(ulContainer, oldNode);
		} else {
			oldNodesByKey[oldNode.id] = oldNode;
		}
	}

	// поэлементно обновить узлы
	for ( var i = 0; i < newNodes.length; i++) {
		var newNode = newNodes[i];
		if (i == (newNodes.length - 1)) {
			newNode.isLast = true;
		}
		var oldNode = oldNodesByKey[newNode.id];
		if (oldNode) {
			var oldNodeLi = oldNode.nodeLi;
			if (i < oldNodes.length) {
				// старый узел находящийся на том же месте
				var mirrorOldNode = oldNodes[i];
				if (mirrorOldNode.id == newNode.id) {
					// находится на том же месте
				} else {
					// необходимо перемещение
					this.moveToEndExistSubNode(ulContainer, oldNode);
				}
			} else {
				// необходимо перемещение
				this.moveToEndExistSubNode(ulContainer, oldNode);
			}
			this.updateExistNode(oldNodeLi, newNode);
		} else {
			// нет узла с таким ключом среди старых - необходимо добавить
			this.appendNewNode(ulContainer, newNode, true, true);
		}
	}
};

/**
 * Обновляет узел и все дочерние узлы из новой модели узла
 */
tabaga.TreeControl.prototype.updateExistNode = function(nodeLi, newNodeModel) {
	var oldNodeModel = nodeLi.nodeModel;
	var oldSubnodes = oldNodeModel.children;
	var newSubnodes = newNodeModel.children;

	// 1. обновление модели узла. Перекрестная ссылка.
	newNodeModel.nodeLi = nodeLi;
	nodeLi.nodeModel = newNodeModel;
	this.allNodesMap[newNodeModel.id] = newNodeModel;

	// 2. обновление визуальной информации узла
	this.updateVisualNodeLi(nodeLi, newNodeModel);

	var hasChildren = (newSubnodes != null && newSubnodes.length > 0);
	var oldHasChildren = (nodeLi.subnodesUl != null);

	if (oldHasChildren) {
		// в предыдущем состоянии узел имел дочерние узлы
		if (hasChildren) {
			// узел имеет дочерние элементы
			newNodeModel.hasChildren = true;
		} else {
			// узел не имеет дочерние элементы. Удаляем все
			for ( var i = 0; i < oldSubnodes.length; i++) {
				var oldnode = oldSubnodes[i];
				this.deleteExistSubNode(nodeLi.subnodesUl, oldnode);
			}

			this.enableChildren(nodeLi, false);
			return;
		}
	} else {
		if (hasChildren) {
			// узел не имел детей, а теперь имеет
			this.enableChildren(nodeLi, true);

			var ulContainer = nodeLi.subnodesUl;
			this.appendNewNodes(ulContainer, newSubnodes);
			return;
		}
	}

	var ulContainer = nodeLi.subnodesUl;
	this.updateExistUlNodesContainer(ulContainer, newSubnodes);
};

/**
 * Установка для элемента узла span возможности перемещения в под выбранный узел
 */
tabaga.TreeControl.prototype.enableChildren = function(nodeLi, enable) {
	if (enable) {
		if (nodeLi.subnodesUl) {
			console.error("Ошибка вызова: узел имеет детей");
		} else {
			var hitareaDiv = document.createElement("div");
			hitareaDiv.setAttribute("class", tabaga.LINE_TREE_CLASSES.hitarea + " " +  tabaga.LINE_TREE_CLASSES.closedHitarea);
			nodeLi.insertBefore(hitareaDiv, nodeLi.nodeSpan);
			nodeLi.hitareaDiv = hitareaDiv;
			nodeLi.nodeModel.hasChildren = true;

			var ulContainer = document.createElement("ul");
			ulContainer.setAttribute("style", "display: none");
			nodeLi.appendChild(ulContainer);
			nodeLi.subnodesUl = ulContainer;
		}
	} else {
		if (nodeLi.subnodesUl) {
			nodeLi.removeChild(nodeLi.subnodesUl);
			nodeLi.subnodesUl = null;

			nodeLi.removeChild(nodeLi.hitareaDiv);
			nodeLi.hitareaDiv = null;
			nodeLi.nodeModel.hasChildren = false;
		} else {
			console.error("Ошибка вызова: узел не имеет детей");
		}
	}
};

/**
 * Установка для элемента узла span возможности перемещения в под выбранный узел
 */
tabaga.TreeControl.prototype.setDragAndDropChildNode = function(nodeSpan) {
	new tabaga.DragObject(nodeSpan, this.dragAndDropScrollContainer);
	new tabaga.DropTarget(nodeSpan);
};

/**
 * Добавить новый узел
 */
tabaga.TreeControl.prototype.appendNewNode = function(parentUl, newNode) {
	var newLi = document.createElement("li");
	newLi.setAttribute("id", newNode.id);
	newLi.onclick = tabaga.onSelectTreeNode;
	parentUl.appendChild(newLi);

	var subnodes = newNode.children;

	var hasChildren = (subnodes != null && subnodes.length > 0);

	var nodeSpan = document.createElement("span");
	nodeSpan.setAttribute("id", "s" + newNode.id);
	nodeSpan.setAttribute("class", tabaga.LINE_TREE_CLASSES.treeNode);
	nodeSpan.innerHTML = newNode.title;
	newLi.appendChild(nodeSpan);
	newLi.nodeSpan = nodeSpan;
	newLi.treeControl = this;

	if (this.enableDragAndDrop) {
		this.setDragAndDropChildNode(nodeSpan);
	}

	// Внимание!!! создание перекрестной ссылки. 1 - необходимо например при
	// получении модели узла в событиях. 2 - вторая ссылка используется при
	// обновлении дерева
	newLi.nodeModel = newNode;
	newNode.nodeLi = newLi;

	this.allNodesMap[newNode.id] = newNode;

	// добавить детей
	if (hasChildren) {
		this.enableChildren(newLi, true);
		var ulContainer = newLi.subnodesUl;
		this.appendNewNodes(ulContainer, subnodes);
	}

};

/**
 * Вставить массив новых узлов
 */
tabaga.TreeControl.prototype.appendNewNodes = function(ulContainer, newNodes) {
	for ( var i = 0; i < newNodes.length; i++) {
		var newNode = newNodes[i];
		if (i == (newNodes.length - 1)) {
			newNode.isLast = true;
		}
		this.appendNewNode(ulContainer, newNode);
	}
};

/**
 * Удалить существующий узел
 */
tabaga.TreeControl.prototype.deleteExistSubNode = function(parentUl,
		deletedNode) {
	var deletedLi = deletedNode.nodeLi;

	// рекурсивно удалить и все дочерние узлы
	var subnodes = deletedNode.children;
	if (subnodes != null && subnodes.length > 0) {
		var subnodesUlContainer = deletedLi.subnodesUl;
		for ( var i = 0; i < subnodes.length; i++) {
			var subnode = subnodes[i];
			this.deleteExistSubNode(subnodesUlContainer, subnode);
		}
	}

	deletedLi.nodeModel = null; // убрать перекрестную зависимость
	deletedNode.nodeLi = null;
	deletedLi.nodeSpan.dropTarget = null; // drag and drop
	deletedLi.nodeSpan.dragObject = null; // drag and drop
	deletedLi.hitareaDiv = null;
	deletedLi.nodeSpan = null;
	deletedLi.subnodesUl = null;
	deletedLi.treeControl = null;
	this.allNodesMap[deletedNode.id] = null;
	parentUl.removeChild(deletedLi);
};

/**
 * Переместить существующий узел
 */
tabaga.TreeControl.prototype.moveToEndExistSubNode = function(parentUl,
		movedNode) {
	var movedNodeLi = movedNode.nodeLi;

	// переместить HTML элемент
	parentUl.appendChild(movedNodeLi);
};

/**
 * Обновляет видимую часть узла
 */
tabaga.TreeControl.prototype.updateVisualNodeLi = function(nodeLi, newNode) {
	var nodeSpan = nodeLi.nodeSpan;
	nodeSpan.innerHTML = newNode.title;
};

/**
 * Загружает данные модели с сервера в виде JSON
 * 
 * @param nodeLiHtml -
 *            обновляемый узел
 */
tabaga.TreeControl.prototype.feedChildNodes = function(nodeLi) {
	if (this.onStartFeedChildNodes) {
		this.onStartFeedChildNodes(nodeLi);
	}
	
	var nodeModel = nodeLi.nodeModel;
	var mytree = this;
	$.ajax({
		url : this.feedChildNodesUrl,
		dataType : "json",
		data : {
			"nodeId" : nodeModel.id
		},
		success : function(loadedData) {
			// loadedData is array
			mytree.updateExistNode(nodeLi, loadedData[0]);
			if (mytree.onSuccessFeedChildNodes) {
				mytree.onSuccessFeedChildNodes(nodeLi);
			}
		}
	});
};

/**
 * Загружает данные модели с сервера в виде JSON
 * 
 * @param nodeLiHtml -
 *            обновляемый узел
 */
tabaga.TreeControl.prototype.feedTreeScopeNodes = function(nodeId) {
	if (this.onStartFeedTreeScopeNodes) {
		this.onStartFeedTreeScopeNodes(nodeId);
	}
	
	var mytree = this;
	$.ajax({
		url : this.feedTreeScopeNodesUrl,
		dataType : "json",
		data : {
			"nodeId" : nodeId
		},
		success : function(loadedData) {
			mytree.updateExistUlNodesContainer(mytree.treeUl,
					loadedData);
			
			// loadedData is array
			
			//mytree.updateExistNode(nodeLi, loadedData[0]);
			
			//mytree.treeObject = loadedData;
			
			var nodeLi = document.getElementById(nodeId);
			mytree.openNode(nodeLi, false);
			
			if (mytree.onSuccessFeedTreeScopeNodes) {
				mytree.onSuccessFeedTreeScopeNodes(nodeLi);
			}
		}
	});
};

/**
 * Выделение узла дерева
 * 
 * @param nodeLiHtml
 */
tabaga.TreeControl.prototype.selectTreeNode = function(nodeLi,
		saveHistory, enableLoading, setClosed) {
	
	var CLASSES = tabaga.LINE_TREE_CLASSES;
	
	// снять предыдущий выделенный 
	if (this.currentSelectedTreeNodeSpan) {
		this.currentSelectedTreeNodeSpan.setAttribute("class", CLASSES.treeNode);
	}
	
	if (setClosed) {
		this.setNodeClose(nodeLi);
	} else {
		this.setNodeOpen(nodeLi);
	}
	
	var nodeSpan = nodeLi.nodeSpan;
	nodeSpan.setAttribute("class", CLASSES.treeNode + " " + CLASSES.selectedNode);
	this.currentSelectedTreeNodeSpan = nodeSpan;

	var requireLoading = nodeLi.nodeModel.needLoad;
	if (requireLoading) {
		if (enableLoading) {
			this.feedChildNodes(nodeLi);
		}
	}
};

tabaga.TreeControl.prototype.processAllParentNode = function(nodeLi,
		processNode) {
	var nodeUl = nodeLi.parentNode;
	if (nodeUl.nodeName.toLowerCase() == "ul") {
		if (nodeUl.id && nodeUl.id == this.treeUl.id) {
			// конец дерева
			return;
		}
		var parentNodeLi = nodeUl.parentNode;
		if (parentNodeLi) {
			this.processAllParentNode(parentNodeLi, processNode);
			processNode.call(this, parentNodeLi);

		}
	}
};

tabaga.TreeControl.prototype.setNodeOpen = function(nodeLi) {
	var CLASSES = tabaga.LINE_TREE_CLASSES;
	var hasChildren = nodeLi.nodeModel.hasChildren;
	
	// mark node as opened
	nodeLi.opened = true;
	
	if (!hasChildren) {
		return;
	}

	var isLast = nodeLi.nodeModel.isLast; 
	var nLi = $(nodeLi);
	if (isLast) {
		nLi.removeClass(CLASSES.lastClosed);
		nLi.addClass(CLASSES.lastOpened);
	}

	nLi.removeClass(CLASSES.closed);
	nLi.addClass(CLASSES.opened);

	for ( var x1 = 0; nodeLi.childNodes[x1]; x1++) {
		var subChild = nodeLi.childNodes[x1];
		if (subChild.nodeName.toLowerCase() == "div") {
			var nDiv = $(subChild);
			if (isLast) {
				nDiv.removeClass(CLASSES.lastClosedHitarea);
				nDiv.addClass(CLASSES.lastOpenedHitarea);
			}
			nDiv.removeClass(CLASSES.closedHitarea);
			nDiv.addClass(CLASSES.openedHitarea);
		} else if (subChild.nodeName.toLowerCase() == "span") {

		} else if (subChild.nodeName.toLowerCase() == "ul") {
			subChild.style.display = "block";
		}
	}
};

tabaga.TreeControl.prototype.setNodeClose = function(nodeLi) {
	var CLASSES = tabaga.LINE_TREE_CLASSES;
	var hasChildren = nodeLi.nodeModel.hasChildren;
	
	// mark node as closed
	nodeLi.opened = false;
	
	if (!hasChildren) {
		return;
	}

	var isLast = nodeLi.nodeModel.isLast; 
	var nLi = $(nodeLi);
	if (isLast) {
		nLi.addClass(CLASSES.lastClosed);
		nLi.removeClass(CLASSES.lastOpened);
	}

	nLi.addClass(CLASSES.closed);
	nLi.removeClass(CLASSES.opened);

	for ( var x1 = 0; nodeLi.childNodes[x1]; x1++) {
		var subChild = nodeLi.childNodes[x1];
		if (subChild.nodeName.toLowerCase() == "div") {
			var nDiv = $(subChild);
			if (isLast) {
				nDiv.addClass(CLASSES.lastClosedHitarea);
				nDiv.removeClass(CLASSES.lastOpenedHitarea);
			}
			nDiv.addClass(CLASSES.closedHitarea);
			nDiv.removeClass(CLASSES.openedHitarea);
		} else if (subChild.nodeName.toLowerCase() == "span") {

		} else if (subChild.nodeName.toLowerCase() == "ul") {
			subChild.style.display = "none";
		}
	}
};

tabaga.TreeControl.prototype.openNode = function(nodeLi, setClosed) {
	var mytree = this;
	this.processAllParentNode(nodeLi, function(parentNodeLi) {
		if (!parentNodeLi.nodeModel.opened) {
			mytree.setNodeOpen(parentNodeLi);
		}
	});
	this.selectTreeNode(nodeLi, false, true, setClosed);
};

/**
 * Сформировать хеш для подстановки в URL для последующего восстановления
 * состояния страницы
 * 
 * @param nodeLiHtml
 * @returns {String}
 */
tabaga.TreeControl.prototype.getNodeHash = function(nodeLi) {
	var id = nodeLi.nodeModel.id;
	if (nodeLi.opened!=null && !nodeLi.opened) {
		id = id + "?state=closed";
	}
	return "id-" + id;
};

tabaga.TreeControl.prototype.getNodeInfoByAnchor = function(anchor) {
	var parts = decodeURIComponent(anchor).split('?');
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

tabaga.TreeControl.prototype.detectAnchor = function(anchor) {
	if (anchor) {
		var nodeInfo = this.getNodeInfoByAnchor(anchor);
		var nodeModel = this.allNodesMap[nodeInfo.nodeId];
		if (nodeModel && !nodeModel.fakeNode) {
			this.openNode(nodeModel.nodeLi, nodeInfo.setClosed);
		} else {
			this.feedTreeScopeNodes(nodeInfo.nodeId);
		}
	}
};
