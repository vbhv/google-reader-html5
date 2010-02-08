Logging = new function() {
	var level = 0;
	var levels = {
		debug:0,
		verbose:1,
		info:2,
		warn:3,
		error:4
	};
	var self=this;
	function getlevel = function(lvl_name) {
		if(!(lvl_name in levels)) {
			throw("no such level: " + lvl_name);
		}
		return levels[lvl_name];
	};

	this.setlevel = function(lvl_name) {
		var lvl = getlevel(lvl_name);
		level = levels[lvl_name];
	};

	this.__noSuchMethod__ = function (lvl_name, args) {
		var lvl = getlevel(lvl_name);
		if(lvl >= level) {
			var str = lvl_name.toUpperCase + ": ";
			jQuery.each(arguments, function() {
				str += JSON.stringify(this);
				str += " ";
			}
			console.log(str);
		}
	};
}();

debug = Logging.debug;
verbose = Logging.verbose;
info = Logging.info;
warn = Logging.warn;
error = Logging.error;
