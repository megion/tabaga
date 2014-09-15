/**
 * string serialization
 */
tabaga.stringSerialization = (function() {
	
	function splitStr(str) {
		return decodeURIComponent(str).split(';');
	}
	
	function parsePart(part) {
		var keyValueSplitIndex = part.indexOf("?");
		return {
			key: part.substring(0, keyValueSplitIndex),
			value: part.substring(keyValueSplitIndex+1, part.length)
		};
	}
	
	return {

		getValue : function(key, str) {
			var parts = splitStr(str);
			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				var entry = parsePart(part);
				if (entry.key==key) {
					return entry.value;
				}
			}
			return null;
		},
		
		putValue : function(key, value, str) {
			var parts = splitStr(str);
			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				var entry = parsePart(part);
				if (entry.key==key) {
					return entry.value;
				}
			}
			
			parts.push(); //
			return "new"
		},
		
		removeValue : function(id, str) {
			return "";
		} 
	};
}());