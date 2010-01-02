FuncTools = {
	chain_link: function(chain, args) {
		var next_call;
		var func = chain[0];
		chain = chain.slice(1);
		next_call = function() {
			if(chain.length == 0) {
				return;
			} else {
				chain_link(chain, arguments);
			}
		}
		func.apply(null, args + next_call);
	},

	chain: function() {
		// executes a list of functions, passing
		// the callback arguments of each call into the
		// next function in the list
		chain_link(arguments, []);
	},

	execute_map: function(arr, func, on_complete) {
		var remaining = arr.length;
		jQuery.each(arr, function() {
			func.apply(this, [function() {
				remaining -= 1;
				if (remaining == 0) on_complete();
			}]);
		});
	},

}
