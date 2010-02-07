FuncTools = {
	chain_link: function(chain, args) {
		var next_call;
		var func = chain[0];
		chain = chain.slice(1);
		next_call = function() {
			if(chain.length == 0) {
				return;
			} else {
				FuncTools.chain_link(chain, arguments);
			}
		}
		console.log("next in chain: " + func);
		args = args.slice();
		args.push(next_call);
		func.apply(null, args);
	},

	chain: function(funcs) {
		// executes a list of functions, passing
		// the callback arguments of each call into the
		// next function in the list
		FuncTools.chain_link(funcs, []);
	},

	execute_map: function(arr, func, on_complete) {
		var remaining = arr.length;
		if(remaining == 0) {
			return on_complete();
		}
		jQuery.each(arr, function() {
			var elem = this;
			func.apply(elem, [function() {
				remaining -= 1;
				if (remaining == 0) on_complete();
			}]);
		});
	},

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
	return [async(self), args];
}

Function.prototype.result = function() {
	var self=this;
	var wrapper = function(func_args, cb) {
		func_args = Array.prototype.slice.call(func_args);
		func_args = func_args.slice();
		func_args.push(cb);
		// console.log("result for " + self + " being called with " + func_args);
		async(self).apply(this, func_args);
	}
	return [wrapper, arguments];
}


function baked_instance(instance) {
	for (var prop in instance) {
		if(prop in ['toString', 'init']) {
			continue;
		}
		var func = instance[prop];
		if (func instanceof Function) {
			instance[prop] = func.bind(instance);
		}
	}
	return instance;
}



function map_cb(collection, func, cb) {
	results = [];
	console.log("mapping " + collection.length + " objects");
	for(var i=0; i<collection.length; i++) {
		results.push(yield func.result.call(func, collection[i]));
	}
	if(!(cb instanceof Function)) {
		console.log("while mapping " + JSON.stringify(collection) + "\n\nwith " + JSON.stringify(func) + " , cb = " + JSON.stringify(cb));
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
