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
 * Обработчик события выделения узла дерева
 */
tabaga.onClickTreeNode = function(event) {
	tabaga.stopEventPropagation(event);
	
	var nodeLi = this; // т.к. событие на узле Li

	var treeControl = nodeLi.treeControl;
	
	treeControl.clickNode(nodeLi);

	return false;
};


/**
 * Класс элемента дерева
 * 
 * @param treeId -
 *            ID дерева
 */
tabaga.TreeControl = function(id, treeUl) {
	this.id = id;
	this.treeUl = treeUl;
	this.treeUl.treeControl = this;
	this.currentSelectedTreeNodeSpan = null;
	this.allNodesMap = {};
};

/**
 * Установка конфигурации дерева
 */
tabaga.TreeControl.prototype.configure = function(config) {
	this.conf = config || {};
	this.disableHistory = this.conf.disableHistory;
}

/**
 * Начальная инициализация дерева
 */
tabaga.TreeControl.prototype.init = function(rootNodes) {
	this.appendNewNodes(this.treeUl, rootNodes);
};

tabaga.TreeControl.prototype.clickNode = function(nodeLi) {
	if (this.disableHistory) {
		//
		var setClosed = (nodeLi.opened==null?false:nodeLi.opened);
		//nodeLi.opened = !setClosed;
		this.selectTreeNode(nodeLi, setClosed);
	} else {
		var setClosed = (nodeLi.opened==null?false:nodeLi.opened);
		nodeLi.opened = !setClosed;
		var hash = this.getNodeHash(nodeLi);
		
		var curAnchor = decodeURIComponent(location.hash.slice(1));
		var newAnchor = tabaga.historyMaster.putValue(this.id, hash, curAnchor);
		jQuery.history.load(newAnchor);
		// выделение узла в данном случае осуществляет callback history 
	}
};

/**
 * Обновляет содержимое существующего контейнера узлов UL
 */
tabaga.TreeControl.prototype.updateExistUlNodesContainer = function(
		ulContainer, newNodes) {
	var oldNodes = null;
	if (ulContainer) { 
		oldNodes = ulContainer.nodeModels;
		ulContainer.nodeModels = newNodes;
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

tabaga.TreeControl.prototype.processAllNodes = function(processorFn) {
	for(var nodeId in this.allNodesMap) {
		var nodeModel = this.allNodesMap[nodeId];
		var nodeLi = nodeModel.nodeLi;
		processorFn.call(this, nodeLi);
	}
};

/**
 * Добавить новый узел
 */
tabaga.TreeControl.prototype.appendNewNode = function(parentUl, newNode) {
	var newLi = document.createElement("li");
	
	// задаем onclick обработчик по умолчанию.
	// При желании можно поменять перегрузив appendNewNode  
	newLi.onclick = tabaga.onClickTreeNode;
	
	parentUl.appendChild(newLi);

	var subnodes = newNode.children;

	var hasChildren = (subnodes != null && subnodes.length > 0);

	var nodeSpan = document.createElement("span");
	nodeSpan.setAttribute("class", tabaga.LINE_TREE_CLASSES.treeNode);
	nodeSpan.innerHTML = newNode.title;
	newLi.appendChild(nodeSpan);
	newLi.nodeSpan = nodeSpan;
	newLi.treeControl = this;

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
	
	return newLi;

};

/**
 * Вставить массив новых узлов
 */
tabaga.TreeControl.prototype.appendNewNodes = function(ulContainer, newNodes) {
	ulContainer.nodeModels = newNodes;
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
tabaga.TreeControl.prototype.loadChildNodes = function(nodeLi) {
	console.error("Function loadChildNodes should be overriden");
};

/**
 * Загружает данные модели с сервера в виде JSON
 * 
 * @param nodeLiHtml -
 *            обновляемый узел
 */
tabaga.TreeControl.prototype.loadTreeScopeNodes = function(nodeId, setClosed) {
	console.error("Function loadTreeScopeNodes should be overriden");
};

/**
 * Установить видимость выделения узла
 */
tabaga.TreeControl.prototype.setSelectionTreeNode = function(nodeLi) {
	var CLASSES = tabaga.LINE_TREE_CLASSES;

	// снять предыдущий выделенный
	if (this.currentSelectedTreeNodeSpan) {
		this.currentSelectedTreeNodeSpan.className = CLASSES.treeNode;
	}
	var nodeSpan = nodeLi.nodeSpan;
	nodeSpan.className = CLASSES.treeNode + " " + CLASSES.selectedNode;
	console.log("set selection: " + nodeSpan.className + " " + nodeSpan.innerHTML);
	this.currentSelectedTreeNodeSpan = nodeSpan;
}

/**
 * Выделение узла дерева
 * 
 * @param nodeLiHtml
 */
tabaga.TreeControl.prototype.selectTreeNode = function(nodeLi, setClosed) {
	this.setSelectionTreeNode(nodeLi);
	if (setClosed) {
		this.setNodeClose(nodeLi);
	} else {
		this.setNodeOpen(nodeLi);
	}
	
	var requireLoading = nodeLi.nodeModel.needLoad;
	if (requireLoading) {
		this.loadChildNodes(nodeLi);
	}
};

tabaga.TreeControl.prototype.processAllParentNode = function(nodeLi,
		processNode) {
	var nodeUl = nodeLi.parentNode;
	if (nodeUl.nodeName.toLowerCase() == "ul") {
		if (nodeUl == this.treeUl) {
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
	this.selectTreeNode(nodeLi, setClosed);
};

/**
 * Сформировать хеш для подстановки в URL для последующего восстановления
 * состояния страницы
 * 
 * @param nodeLiHtml
 * @returns {String}
 */
tabaga.TreeControl.prototype.getNodeHash = function(nodeLi) {
	var nodeId = nodeLi.nodeModel.id;
	if (nodeLi.opened!=null && !nodeLi.opened) {
		nodeId = nodeId + "&state=closed";
	}
	return "id-" + nodeId;
};

tabaga.TreeControl.prototype.getNodeInfoByAnchor = function(anchor) {
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

tabaga.TreeControl.prototype.detectAnchor = function(anchor) {
	if (anchor) {
		var treeHash = tabaga.historyMaster.getValue(this.id, decodeURIComponent(anchor));
		if (!treeHash) {
			return;
		}
		var nodeInfo = this.getNodeInfoByAnchor(treeHash);
		var nodeModel = this.allNodesMap[nodeInfo.nodeId];
		if (nodeModel && !nodeModel.fakeNode) {
			this.openNode(nodeModel.nodeLi, nodeInfo.setClosed);
		} else {
			this.loadTreeScopeNodes(nodeInfo.nodeId, nodeInfo.setClosed);
		}
	}
};
