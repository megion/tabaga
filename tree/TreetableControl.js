/**
 * Класс элемента дерева
 * 
 * @param treeId -
 *            ID дерева
 */
tabaga.TreetableControl = function(id, treeEl) {
	tabaga.AbstractTreeControl.apply(this, arguments);
};

tabaga.TreetableControl.prototype = Object.create(tabaga.AbstractTreeControl.prototype);

/**
 * Начальная инициализация дерева
 */
tabaga.TreetableControl.prototype.init = function(rootNodes) {
	var tBodies = this.treeEl.tBodies;
	if (tBodies && (tBodies.length > 0)) {
		// get first el
		this.tableBodyEl = tBodies[0];
	} else {
		// create tbody
		this.tableBodyEl = document.createElement('tbody');
		this.treeEl.appendChild(tableBodyEl);
	}
	this.rootNodes = rootNodes;
	this.appendNewNodes(rootNodes);
};

/**
 * Вставить массив корневых новых узлов
 */
tabaga.TreetableControl.prototype.appendNewNodes = function(rootNodes) {
	for ( var i = 0; i < rootNodes.length; i++) {
		var newNode = rootNodes[i];
		if (i == (rootNodes.length - 1)) {
			newNode.isLast = true;
		}
		this.appendNewNode(newNode);
	}
};

/**
 * Добавить новый узел
 */
tabaga.TreetableControl.prototype.appendNewNode = function(newNode) {
	var newTr = document.createElement("tr");
	
	// задаем onclick обработчик по умолчанию.
	// При желании можно поменять перегрузив appendNewNode  
	newTr.onclick = tabaga.AbstractTreeControl.onClickTreeNode;
	this.tableBodyEl.appendChild(newTr);

	var subnodes = newNode.children;

	var hasChildren = (subnodes != null && subnodes.length > 0);
	
	var td1 = document.createElement("tr");
	newTr.appendChild(td1);

	var nodeSpan = document.createElement("span");
	nodeSpan.className = tabaga.AbstractTreeControl.TREE_CLASSES.treeNode;
	nodeSpan.innerHTML = newNode.title;
	td1.appendChild(nodeSpan);
	newTr.nodeSpan = nodeSpan;
	newTr.treeControl = this;

	// Внимание!!! создание перекрестной ссылки. 1 - необходимо например при
	// получении модели узла в событиях. 2 - вторая ссылка используется при
	// обновлении дерева
	newTr.nodeModel = newNode;
	newNode.nodeEl = newTr;

	this.allNodesMap[newNode.id] = newNode;

	// добавить детей
	if (hasChildren) {
		this.enableChildren(newTr, true);
		//newTr.subnodes = subnodes;
		this.appendNewNodes(subnodes);
	}
	
	return newTr;

};

/**
 * Установка для элемента узла span возможности перемещения в под выбранный узел
 */
tabaga.TreetableControl.prototype.enableChildren = function(nodeEl, enable) {
	if (enable) {
		var hitareaDiv = document.createElement("div");
		hitareaDiv.className = tabaga.AbstractTreeControl.TREE_CLASSES.hitarea + " " +  tabaga.AbstractTreeControl.TREE_CLASSES.closedHitarea;
		nodeEl.insertBefore(hitareaDiv, nodeEl.nodeSpan);
		nodeEl.hitareaDiv = hitareaDiv;
		nodeEl.nodeModel.hasChildren = true;
	} else {
		nodeEl.removeChild(nodeEl.hitareaDiv);
		nodeEl.hitareaDiv = null;
		nodeEl.nodeModel.hasChildren = false;
	}
};

/**
 * Обновляет элементы начиная с корня 
 */
tabaga.TreetableControl.prototype.updateNodes = function(newNodes, oldNodes, updateCloseState) {
	// новых узлов нет
	if (newNodes == null || newNodes.length == 0) {
		if (oldNodes != null && oldNodes.length > 0) {
			for ( var i = 0; i < oldNodes.length; i++) {
				var oldnode = oldNodes[i];
				this.deleteExistNode(oldnode);
			}
		}
		return;
	}

	// подготовить new nodes HashMaps (key->nodeId, value->node)
	var newNodesByKey = new Object();
	for (var i = 0; i < newNodes.length; i++) {
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
			this.deleteExistNode(oldNode);
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
			if (i < oldNodes.length) {
				// старый узел находящийся на том же месте
				var mirrorOldNode = oldNodes[i];
				if (mirrorOldNode.id == newNode.id) {
					// находится на том же месте
				} else {
					// необходимо перемещение после предыдущего
					this.moveToAfterExistSubNode(oldNode, prevNewNode, oldNodes[0]);
				}
			} else {
				// необходимо перемещение в конец
				this.moveToEndExistSubNode(oldNode, prevNewNode);
			}
			this.updateExistNode(oldNode, newNode, updateCloseState);
		} else {
			// нет узла с таким ключом среди старых - необходимо добавить
			this.appendNewNode(newNode);
		}
		
		prevNewNode = newNode;
	}
};

/**
 * Переместить существующий узел после указанного узла
 */
tabaga.TreetableControl.prototype.moveToAfterExistSubNode = function(movedNode, afterNode, oldFirstNode) {
	var movedNodeEl = movedNode.nodeEl;
	if (afterNode) {
		tabaga.insertAfter(movedNodeEl, afterNode.nodeEl);
	} else {
		this.tableBodyEl.insertBefore(movedNodeEl, oldFirstNode.nodeEl);
	}
};

/**
 * Переместить существующий узел
 */
tabaga.TreetableControl.prototype.moveToEndExistSubNode = function(
		movedNode, afterNode) {
	var movedNodeEl = movedNode.nodeEl;
	tabaga.insertAfter(movedNodeEl, afterNode.nodeEl);
};

/**
 * Удалить существующий узел
 */
tabaga.TreetableControl.prototype.deleteExistNode = function(deletedNode) {
	var deletedTr = deletedNode.nodeEl;

	// рекурсивно удалить и все дочерние узлы
	var subnodes = deletedNode.children;
	if (subnodes != null && subnodes.length > 0) {
		for ( var i = 0; i < subnodes.length; i++) {
			var subnode = subnodes[i];
			this.deleteExistNode(subnode);
		}
	}
	
	if (this.currentSelectedNodeEl &&
			this.currentSelectedNodeEl.nodeModel.id == deletedNode.id) {
		this.clearSelectionTreeNode();
		this.removeState();
	}

	deletedTr.nodeModel = null; // убрать перекрестную зависимость
	deletedNode.nodeEl = null;
	deletedTr.hitareaDiv = null;
	deletedTr.nodeSpan = null;
	deletedTr.treeControl = null;
	delete this.allNodesMap[deletedNode.id];
	this.tableBodyEl.removeChild(deletedLi);
};

/**
 * Обновляет узел и все дочерние узлы из новой модели узла
 */
tabaga.TreetableControl.prototype.updateExistNode = function(oldNode, newNode, updateCloseState) {
	var nodeEl = oldNode.nodeEl;
	var oldSubnodes = oldNode.children;
	var newSubnodes = newNode.children;

	// 1. обновление модели узла. Перекрестная ссылка.
	newNode.nodeEl = nodeEl;
	nodeEl.nodeModel = newNode;
	this.allNodesMap[newNode.id] = newNode;

	// 2. обновление визуальной информации узла
	this.updateVisualNodeEl(nodeEl, newNode);

	var hasChildren = (newSubnodes != null && newSubnodes.length > 0);
	var oldHasChildren = (oldSubnodes != null && oldSubnodes.length > 0);

	if (oldHasChildren) {
		// в предыдущем состоянии узел имел дочерние узлы
		if (hasChildren) {
			// узел имеет дочерние элементы
			newNode.hasChildren = true;
		} else {
			// узел не имеет дочерние элементы. Удаляем все
			for ( var i = 0; i < oldSubnodes.length; i++) {
				var oldnode = oldSubnodes[i];
				this.deleteExistNode(oldnode);
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

			this.appendNewNodes(newSubnodes);
			return;
		}
	}
	
	if (updateCloseState) {
		// close node if need loading
		if (nodeEl.nodeModel.needLoad) {
			this.setNodeClose(nodeEl, true);
		}
	}
	
	this.updateNodes(newSubnodes, oldSubnodes, updateCloseState);
};

/**
 * Обновляет видимую часть узла
 */
tabaga.TreetableControl.prototype.updateVisualNodeEl = function(nodeEl, newNode) {
	var nodeSpan = nodeEl.nodeSpan;
	nodeSpan.innerHTML = newNode.title;
};

/**
 * Установить видимость выделения узла
 */
tabaga.TreetableControl.prototype.setSelectionTreeNode = function(nodeEl) {
	var CLASSES = tabaga.AbstractTreeControl.TREE_CLASSES;

	// снять предыдущий выделенный
	if (this.currentSelectedNodeEl) {
		tabaga.removeClass(this.currentSelectedNodeEl.nodeSpan, CLASSES.selectedNode);
	}
	
	this.currentSelectedNodeEl = nodeEl;
	tabaga.addClass(this.currentSelectedNodeEl.nodeSpan, CLASSES.selectedNode);
};

tabaga.TreetableControl.prototype.clearSelectionTreeNode = function() {
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
tabaga.TreetableControl.prototype.selectTreeNode = function(nodeEl, setClosed) {
	this.setSelectionTreeNode(nodeEl);
	this.setNodeClose(nodeEl, setClosed);
	
	var requireLoading = nodeEl.nodeModel.needLoad;
	if (requireLoading) {
		this.loadChildNodes(nodeEl);
	}
};

tabaga.TreetableControl.prototype.setNodeClose = function(nodeEl, closed) {
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
