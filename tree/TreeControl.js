/**
 * Класс элемента дерева
 * 
 * @param treeId -
 *            ID дерева
 */
tabaga.TreeControl = function(id, treeEl) {
	tabaga.AbstractTreeControl.apply(this, arguments);
};

tabaga.TreeControl.prototype = Object.create(tabaga.AbstractTreeControl.prototype);

/**
 * Начальная инициализация дерева
 */
tabaga.TreeControl.prototype.init = function(rootNodes) {
	this.appendNewNodes(this.treeEl, rootNodes);
};

tabaga.TreeControl.prototype.updateRootNodes = function(rootNodes, updateCloseState) {
	this.updateExistUlNodesContainer(this.treeEl, rootNodes, updateCloseState);
};

/**
 * Обновляет содержимое существующего контейнера узлов UL
 */
tabaga.TreeControl.prototype.updateExistUlNodesContainer = function(
		ulContainer, newNodes, updateCloseState) {
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
	var prevNewNode = null;
	for ( var i = 0; i < newNodes.length; i++) {
		var newNode = newNodes[i];
		if (i == (newNodes.length - 1)) {
			newNode.isLast = true;
		}
		var oldNode = oldNodesByKey[newNode.id];
		if (oldNode) {
			var oldNodeEl = oldNode.nodeEl;
			if (i < oldNodes.length) {
				// старый узел находящийся на том же месте
				var mirrorOldNode = oldNodes[i];
				if (mirrorOldNode.id == newNode.id) {
					// находится на том же месте
				} else {
					// необходимо перемещение после предыдущего
					this.moveToAfterExistSubNode(ulContainer, oldNode, prevNewNode);
				}
			} else {
				// необходимо перемещение в конец
				this.moveToEndExistSubNode(ulContainer, oldNode);
			}
			this.updateExistNode(oldNodeEl, newNode, updateCloseState);
		} else {
			// нет узла с таким ключом среди старых - необходимо добавить
			this.appendNewNode(ulContainer, newNode);
		}
		
		prevNewNode = newNode;
	}
};

/**
 * Обновляет узел и все дочерние узлы из новой модели узла
 */
tabaga.TreeControl.prototype.updateExistNode = function(nodeEl, newNodeModel, updateCloseState) {
	var oldNodeModel = nodeEl.nodeModel;
	var oldSubnodes = oldNodeModel.children;
	var newSubnodes = newNodeModel.children;

	// 1. обновление модели узла. Перекрестная ссылка.
	newNodeModel.nodeEl = nodeEl;
	nodeEl.nodeModel = newNodeModel;
	this.allNodesMap[newNodeModel.id] = newNodeModel;

	// 2. обновление визуальной информации узла
	this.updateVisualNodeEl(nodeEl, newNodeModel);

	var hasChildren = (newSubnodes != null && newSubnodes.length > 0);
	var oldHasChildren = (nodeEl.subnodesUl != null);

	if (oldHasChildren) {
		// в предыдущем состоянии узел имел дочерние узлы
		if (hasChildren) {
			// узел имеет дочерние элементы
			newNodeModel.hasChildren = true;
		} else {
			// узел не имеет дочерние элементы. Удаляем все
			for ( var i = 0; i < oldSubnodes.length; i++) {
				var oldnode = oldSubnodes[i];
				this.deleteExistSubNode(nodeEl.subnodesUl, oldnode);
			}

			this.enableChildren(nodeEl, false);
			return;
		}
	} else {
		if (hasChildren) {
			// узел не имел детей, а теперь имеет
			this.enableChildren(nodeEl, true);
			
			// если текущий выделенный узел не имел дочерних,
			// а после обновления стал иметь при этом он находился в открытом состоянии,
			// то его необходимо открыть вручную 
			if (updateCloseState && this.currentSelectedNodeEl &&
					this.currentSelectedNodeEl.nodeModel.id == newNodeModel.id) {
				if (nodeEl.opened) {
					this.setNodeClose(nodeEl, false);
				}
			}

			var ulContainer = nodeEl.subnodesUl;
			this.appendNewNodes(ulContainer, newSubnodes);
			return;
		}
	}
	
	if (updateCloseState) {
		// close node if need loading
		if (nodeEl.nodeModel.needLoad) {
			this.setNodeClose(nodeEl, true);
		}
	}
	
	var ulContainer = nodeEl.subnodesUl;
	this.updateExistUlNodesContainer(ulContainer, newSubnodes, updateCloseState);
};

/**
 * Установка для элемента узла span возможности перемещения в под выбранный узел
 */
tabaga.TreeControl.prototype.enableChildren = function(nodeEl, enable) {
	if (enable) {
		if (nodeEl.subnodesUl) {
			console.error("Error call: node have children");
		} else {
			var hitareaDiv = document.createElement("div");
			hitareaDiv.className = tabaga.AbstractTreeControl.TREE_CLASSES.hitarea + " " +  tabaga.AbstractTreeControl.TREE_CLASSES.closedHitarea;
			nodeEl.insertBefore(hitareaDiv, nodeEl.nodeSpan);
			nodeEl.hitareaDiv = hitareaDiv;
			nodeEl.nodeModel.hasChildren = true;

			var ulContainer = document.createElement("ul");
			ulContainer.style.display = "none";
			nodeEl.appendChild(ulContainer);
			nodeEl.subnodesUl = ulContainer;
		}
	} else {
		if (nodeEl.subnodesUl) {
			nodeEl.removeChild(nodeEl.subnodesUl);
			nodeEl.subnodesUl = null;

			nodeEl.removeChild(nodeEl.hitareaDiv);
			nodeEl.hitareaDiv = null;
			nodeEl.nodeModel.hasChildren = false;
		} else {
			console.error("Error call: node have not children");
		}
	}
};

tabaga.TreeControl.prototype.processAllParentNode = function(nodeEl,
		processNodeFn) {
	var nodeUl = nodeEl.parentNode;
	if (nodeUl.nodeName.toLowerCase() == "ul") {
		if (nodeUl == this.treeEl) {
			// конец дерева
			return;
		}
		var parentNodeEl = nodeUl.parentNode;
		if (parentNodeEl) {
			this.processAllParentNode(parentNodeEl, processNodeFn);
			processNodeFn.call(this, parentNodeEl);
		}
	}
};

/**
 * Добавить новый узел
 */
tabaga.TreeControl.prototype.appendNewNode = function(parentUl, newNode) {
	var newLi = document.createElement("li");
	
	// задаем onclick обработчик по умолчанию.
	// При желании можно поменять перегрузив appendNewNode  
	newLi.onclick = tabaga.AbstractTreeControl.onClickTreeNode;
	
	parentUl.appendChild(newLi);

	var subnodes = newNode.children;

	var hasChildren = (subnodes != null && subnodes.length > 0);

	var nodeSpan = document.createElement("span");
	nodeSpan.className = tabaga.AbstractTreeControl.TREE_CLASSES.treeNode;
	nodeSpan.innerHTML = newNode.title;
	newLi.appendChild(nodeSpan);
	newLi.nodeSpan = nodeSpan;
	newLi.treeControl = this;

	// Внимание!!! создание перекрестной ссылки. 1 - необходимо например при
	// получении модели узла в событиях. 2 - вторая ссылка используется при
	// обновлении дерева
	newLi.nodeModel = newNode;
	newNode.nodeEl = newLi;

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
	var deletedLi = deletedNode.nodeEl;

	// рекурсивно удалить и все дочерние узлы
	var subnodes = deletedNode.children;
	if (subnodes != null && subnodes.length > 0) {
		var subnodesUlContainer = deletedLi.subnodesUl;
		for ( var i = 0; i < subnodes.length; i++) {
			var subnode = subnodes[i];
			this.deleteExistSubNode(subnodesUlContainer, subnode);
		}
	}
	
	if (this.currentSelectedNodeEl &&
			this.currentSelectedNodeEl.nodeModel.id == deletedNode.id) {
		this.clearSelectionTreeNode();
		this.removeState();
	}

	deletedLi.nodeModel = null; // убрать перекрестную зависимость
	deletedNode.nodeEl = null;
	deletedLi.hitareaDiv = null;
	deletedLi.nodeSpan = null;
	deletedLi.subnodesUl = null;
	deletedLi.treeControl = null;
	delete this.allNodesMap[deletedNode.id];
	parentUl.removeChild(deletedLi);
};

/**
 * Переместить существующий узел
 */
tabaga.TreeControl.prototype.moveToEndExistSubNode = function(parentUl,
		movedNode) {
	var movedNodeEl = movedNode.nodeEl;

	// переместить HTML элемент
	parentUl.appendChild(movedNodeEl);
	console.log("move '" + movedNode.title + "' to end");
};

/**
 * Переместить существующий узел после указанного узла
 */
tabaga.TreeControl.prototype.moveToAfterExistSubNode = function(parentUl,
		movedNode, afterNode) {
	var movedNodeEl = movedNode.nodeEl;
	
	if (afterNode) {
		tabaga.insertAfter(movedNodeEl, afterNode.nodeEl);
		console.log("move '" + movedNode.title + "' after '" + afterNode.title + "'");
	} else {
		parentUl.insertBefore(movedNodeEl, parentUl.firstChild);
		console.log("move '" + movedNode.title + "' first ");
	}
};

/**
 * Обновляет видимую часть узла
 */
tabaga.TreeControl.prototype.updateVisualNodeEl = function(nodeEl, newNode) {
	var nodeSpan = nodeEl.nodeSpan;
	nodeSpan.innerHTML = newNode.title;
};

/**
 * Установить видимость выделения узла
 */
tabaga.TreeControl.prototype.setSelectionTreeNode = function(nodeEl) {
	var CLASSES = tabaga.AbstractTreeControl.TREE_CLASSES;

	// снять предыдущий выделенный
	if (this.currentSelectedNodeEl) {
		tabaga.removeClass(this.currentSelectedNodeEl.nodeSpan, CLASSES.selectedNode);
	}
	
	this.currentSelectedNodeEl = nodeEl;
	tabaga.addClass(this.currentSelectedNodeEl.nodeSpan, CLASSES.selectedNode);
};

tabaga.TreeControl.prototype.clearSelectionTreeNode = function() {
	var CLASSES = tabaga.AbstractTreeControl.TREE_CLASSES;
	if (this.currentSelectedNodeEl) {
		tabaga.removeClass(this.currentSelectedNodeEl.nodeSpan, CLASSES.selectedNode);
	}
	this.currentSelectedNodeEl = null;
};

/**
 * Выделение узла дерева
 * 
 * @param nodeElHtml
 */
tabaga.TreeControl.prototype.selectTreeNode = function(nodeEl, setClosed) {
	this.setSelectionTreeNode(nodeEl);
	this.setNodeClose(nodeEl, setClosed);
	
	var requireLoading = nodeEl.nodeModel.needLoad;
	if (requireLoading) {
		this.loadChildNodes(nodeEl);
	}
};

tabaga.TreeControl.prototype.setNodeClose = function(nodeEl, closed) {
	tabaga.AbstractTreeControl.prototype.setNodeClose.apply(this, arguments);
	
	var CLASSES = tabaga.AbstractTreeControl.TREE_CLASSES;
	var isLast = nodeEl.nodeModel.isLast; 
	
	for ( var x1 = 0; nodeEl.childNodes[x1]; x1++) {
		var subChild = nodeEl.childNodes[x1];
		if (subChild.nodeName.toLowerCase() == "div") {
			if (isLast) {
				if (closed) {
				    tabaga.addClass(subChild, CLASSES.lastClosedHitarea);
				    tabaga.removeClass(subChild, CLASSES.lastOpenedHitarea);
				} else {
					tabaga.addClass(subChild, CLASSES.lastOpenedHitarea);
				    tabaga.removeClass(subChild, CLASSES.lastClosedHitarea);
				}
			}
			if (closed) {
				tabaga.addClass(subChild, CLASSES.closedHitarea);
				tabaga.removeClass(subChild, CLASSES.openedHitarea);
			} else {
				tabaga.addClass(subChild, CLASSES.openedHitarea);
				tabaga.removeClass(subChild, CLASSES.closedHitarea);
			}
		} else if (subChild.nodeName.toLowerCase() == "span") {
            //
		} else if (subChild.nodeName.toLowerCase() == "ul") {
			if (closed) {
				subChild.style.display = "none";	
			} else {
				subChild.style.display = "block";
			}
		}
	}
};
