tabaga
======

Simple object oriented JavaScript GUI controls (tree control) library.
Tree control support lazy loading data, updating part of tree and drag and drop.

###Usage

```html
<ul id="treePages" class="filetree treeview"></ul>
```

```js
// override TreeControl
function PageTreeControl() {
	tabaga.TreeControl.apply(this, arguments);
}
PageTreeControl.prototype = Object.create(tabaga.TreeControl.prototype);

// override method appendNewNode
PageTreeControl.prototype.appendNewNode = function(parentUl, newNode) {
   // call super method
   var newNodeLi = tabaga.TreeControl.prototype.appendNewNode.apply(this,
			arguments);
    
   // add some code ...
};

var treeObj =<%-JSON.stringify(treeJson)%>;	
var config = {
	TreeControlConstructor: PageTreeControl
}
jQuery("#treePages").createTreeControl("1", config, treeObj);
``` 
