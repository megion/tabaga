/**
 * Master modal windows
 */
tabaga.modalMaster = (function() {
	var modalWindowStack = [];
	var _modalBg = null;
	var START_ZINDEX = 100;
	var START_TOP = 20;
	
	function getModalBg() {
		if (_modalBg) {
			return _modalBg;
		}
		
		_modalBg = document.createElement("div");
		_modalBg.className = "modalBg";
		document.body.appendChild(_modalBg);
		return _modalBg;
	}
	
	function createModalWindow(modalCreator) {
		var mbg = getModalBg();
		if (mbg.style.display) {
			// set display 
			mbg.style.display = null;
		}
		var z = START_ZINDEX + 2*modalWindowStack.length;
		mbg.style.zIndex = z + "";
		var top = START_TOP +6*modalWindowStack.length;
		
		var modalWindow = document.createElement("div");
		modalWindow.className = "modalWindow";
		modalWindow.style.zIndex = z + 1 + "";
		modalWindow.style.top = top + "px";
		document.body.appendChild(modalWindow);
		
		var copyargs = Array.prototype.slice.call(arguments);
		copyargs.splice(0, 1, modalWindow);
		modalCreator.onCreate.apply(modalCreator, copyargs);
		
		modalWindowStack.push({creator: modalCreator, modal: modalWindow});
	}
	
	function closeLastModal() {
		var md = modalWindowStack.pop();
		md.creator.onDestroy(md.modal);
		
		document.body.removeChild(md.modal);
		
		var mbg = getModalBg();
		if (modalWindowStack.length==0) {
			// set display 
			mbg.style.display = 'none';
		} else {
		    var z = START_ZINDEX + 2*(modalWindowStack.length-1);
		    mbg.style.zIndex = z + "";
		}
		
	}

	return {
		openModal : function() {
			createModalWindow.apply(this, arguments);
		},
		closeModal : function() {
			closeLastModal();
		}
	};
}());