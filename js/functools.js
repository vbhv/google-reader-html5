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

Function.prototype.result_raw = function() {
	var self = this;
	var args = arguments;
	return [self, args];
}

Function.prototype.result = function() {
	var self=this;
	var wrapper = function(func_args, cb) {
		func_args = Array.prototype.slice.call(func_args);
		func_args = func_args.slice();
		func_args.push(cb);
		// debug("result for " + self + " being called with " + func_args);
		async(self).apply(this, func_args);
	}
	return [wrapper, arguments];
}
Function.prototype._ = Function.prototype.result;


var map_cb = (function(collection, func, cb) {
	results = [];
	for(var i=0; i<collection.length; i++) {
		results.push(yield func.result(collection[i]));
	}
	if(!(cb instanceof Function)) {
		error("while mapping " + JSON.stringify(collection) + "\n\nwith " + JSON.stringify(func) + " , cb = " + JSON.stringify(cb));
	}
	cb(results);
}).bake();

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

Array.prototype.sort_by = function(key_func) {
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
