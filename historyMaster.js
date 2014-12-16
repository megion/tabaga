/**
 * string serialization
 */
tabaga.historyMaster = (function() {
	
	function splitStr(str) {
		return str.split('/');//decodeURIComponent(str).split(';');
	}
	
	function joinParts(parts) {
		return parts.join('/');
	}
	
	function parsePart(part) {
		var keyValueSplitIndex = part.indexOf(">");
		if (keyValueSplitIndex<1) {
			// key not found
			return null;
		}
		return {
			key: part.substring(0, keyValueSplitIndex),
			value: part.substring(keyValueSplitIndex+1, part.length)
		};
	}
	
	function toPart(entry) {
		return entry.key + ">" + entry.value;
	}
	
	return {

		getValue : function(key, str) {
			var parts = splitStr(str);
			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				var entry = parsePart(part);
				if (entry && entry.key==key) {
					return entry.value;
				}
			}
			return null;
		},
		
		putValue : function(key, value, str) {
			//if(str.length==0) {
				//return toPart({key: key, value: value});
			//}
			
			var parts = splitStr(str);
			
			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				var entry = parsePart(part);
				if (entry && entry.key==key) {
					// update
					entry.value = value;
					parts[i] = toPart(entry);
					return joinParts(parts);
				}
			}
			
			// put new
			parts.push(toPart({key: key, value: value}));
			return joinParts(parts);
		},
		
		removeValue : function(key, str) {
			var parts = splitStr(str);
			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				var entry = parsePart(part);
				if (entry && entry.key==key) {
					// remove
					parts.splice(i, 1);
					return joinParts(parts);
				}
			}
			return str;
		} 
	};
}());