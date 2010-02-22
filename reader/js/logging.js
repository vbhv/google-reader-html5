Logging = new function() {
	var _null = function() {};
	var _console = typeof(console) != 'undefined' ? console : {
		log: _null,
		debug: _null,
		info: _null,
		warn: _null,
		error: alert,
	};

	var self = this;
	var level = 0;
	var levels = {
		debug:0,
		verbose:1,
		info:2,
		warn:3,
		error:4
	};

	var output_funcs = {
		debug:   _console.log,
		verbose: _console.debug,
		info:    _console.info,
		warn:    _console.warn,
		error:   _console.error
	};

	var getlevel = function(lvl_name) {
		if(!(lvl_name in levels)) {
			throw("no such level: " + lvl_name);
		}
		return levels[lvl_name];
	};

	self.setlevel = function(lvl_name) {
		var lvl = getlevel(lvl_name);
		level = levels[lvl_name];
	};


	self.__logfunc = function (lvl_name) {
		var lvl = getlevel(lvl_name);
		return function() {
			var str = lvl_name.toUpperCase() + ": ";
			if(lvl >= level) {
				jQuery.each(arguments, function() {
					str += this;
					str += " ";
				});
				output_funcs[lvl_name](str);
			}
		};
	};

	self.debug   = self.__logfunc("debug");
	self.verbose = self.__logfunc("verbose");
	self.info    = self.__logfunc("info");
	self.warn    = self.__logfunc("warn");
	self.error   = self.__logfunc("error");

}();

var debug = Logging.debug;
var verbose = Logging.verbose;
var info = Logging.info;
var warn = Logging.warn;
var error = Logging.error;
