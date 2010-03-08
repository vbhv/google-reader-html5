function eq(a, b) {
	if(a == b) return true;
	if(!(a instanceof Array && b instanceof Array)) return false; // not an array
	if(a.length != b.length) return false;
	for(var i=0; i<a.length; i++) {
		if(!eq(a[i], b[i])) {
			return false;
		}
	}
	return true;
}

function in_array(needle, haystack) {
	for(var i = 0; i<haystack.length; i++) {
		if (eq(needle, haystack[i])) {
			return i;
		}
	}
	return false;
}

Array.prototype.collapse = function() {
	var result = [];
	for(var i=0; i<this.length; i++) {
		if(this[i] != null) {
			result.push(this[i]);
		}
	}
	return result;
}

Array.prototype.filter = function(f) {
	if(!f) { return this; }
	var result = [];
	for(var i=0; i<this.length; i++) {
		if(f(this[i])) {
			result.push(this[i]);
		}
	}
	return result;
}

Array.prototype.sortBy = function(key_func) {
	if(!(key_func instanceof Function)) {
		var key = key_func;
		key_func = function(obj) {
			return obj[key];
		}
	}
	return this.sort(function(a,b) {
		a = key_func(a);
		b = key_func(b);
		if(a == b) return 0;
		if(a < b) return -1;
		return 1;
	});
}

function NULL_CB(){};
