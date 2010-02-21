var Settings = function() {
	self.tag_filter = [];

	self.change_tag_filter = function(cb) {
		cb(self.tag_filter);
	};
}.BakeConstructor();

