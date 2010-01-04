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
