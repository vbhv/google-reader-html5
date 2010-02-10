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

function __bake(instance) {
	for(var key in instance) {
		var prop = instance[key];
		if(!(prop instanceof Function)) continue;
		if(prop in ['toString', 'init']) continue;
		debug("baking member: " + key);
		instance[key] = __bake_single_function(prop, instance);
	}
	return instance;
}

function __bake_single_function(func, self) {
	var expected = func.length;
	return function() {
		var got = arguments.length;
		var args = Array.slice.call(arguments);
		debug("function expected " + expected + " args, and got " + got);
		console.log(args)
		if(got == expected - 1) {
			debug("wrapping function", func);
			var wrapper = function(func_args, cb) {
				console.log("calling async'd func with: " + func_args + " + " + cb);
		console.log(JSON.stringify(func_args))
				func_args = Array.prototype.slice.call(func_args);
				func_args = func_args.slice();
				func_args.push(cb);
				console.log(func + '')
				return async(func).apply(self, func_args);
			}
			return [wrapper, args];
		} else {
			if(got != expected) {
				error("Expected " + expected + " arguments, got " + got + ". Function: " + func);
			}
			debug("calling function straight:", func);
			return async(func).apply(self, arguments);
		}
	}
}

Function.prototype.Baked = function() {
	var constructor = this;
	return function() {
		console.log("Baked constructor called!");
		if(this === window) {
			throw "Error: constructor called without using the `new` keyword";
		}
		var instance = constructor.apply(this, arguments) || this;
		console.log("got instance: " + instance + ", baking..");
		return __bake(instance);
	}
}

Function.prototype.baked = function(self) {
	var func = this;
	info("baking function: " + func);
	return __bake_single_function(func, self);
}

Function.prototype.bind = function(binding) {
	var self = this;
	return function() {
		// console.log("applying function " + self + " with this=" + binding + " and " + arguments.length + " args");
		return self.apply(binding, arguments);
	};
};

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
		// console.log("result for " + self + " being called with " + func_args);
		self.apply(this, func_args);
	}
	return [wrapper, arguments];
}
Function.prototype._ = Function.prototype.result;


function map_cb(collection, func, cb) {
	results = [];
	console.log("mapping " + collection.length + " objects");
	for(var i=0; i<collection.length; i++) {
		results.push(yield func.result.call(func, collection[i]));
	}
	if(!(cb instanceof Function)) {
		error("while mapping " + JSON.stringify(collection) + "\n\nwith " + JSON.stringify(func) + " , cb = " + JSON.stringify(cb));
	}
	cb(results);
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
