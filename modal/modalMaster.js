/**
 * Master modal windows
 */
tabaga.modalMaster = (function() {
	var modalWindowStack = [];
	var _modalBg = null;
	var START_ZINDEX = 1000;
	
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
		
		var modalWindow = document.createElement("div");
		modalWindow.className = "modalWindow";
		modalWindow.style.zIndex = z + 1 + "";
		document.body.appendChild(modalWindow);
		modalCreator.onCreate(modalWindow);
		
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
		}
		
		var z = START_ZINDEX + modalWindowStack.length;
		mbg.style.zIndex = z + "";
		
	}

	return {
		openModal : function(modalCreator) {
			createModalWindow(modalCreator);
		},
		closeModal : function() {
			closeLastModal();
		}
	};
}());