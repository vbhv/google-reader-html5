
function decorate_instance(instance, prefix) {
return;
	for (var prop in instance) {
		var func = instance[prop];
		if (func instanceof Function) {
			instance[prop] = pass_things(prefix + ": " + prop, func, instance, arguments);
		}
	}
	return instance;
}
	

function pass_things(description, delegate, ths, args){
	return function(){
		console.log(description + " - start");
		var retval = delegate.apply(this, args);
		console.log(description + " - end");
		return retval;
	}
}
