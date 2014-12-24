/**
 * Master modal windows
 */
tabaga.modalMaster = (function() {
	var modalWindowStack = [];
	
	function createModalWindow(modalCreator) {
	}
	
	function closeLastModal() {
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