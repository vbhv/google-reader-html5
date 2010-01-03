function Sync(reader, store) {
	this.reader = reader;
	this.store = store;
	self = this;

	this.pull_tags = function(cb) {
		this.reader.get_user_tags(function(tags) {
			self.store.set_valid_tags(tags, cb);
		});
	};

	this.pull_items = function(tag_name, cb) {
		var self = this;
		this.reader.get_tag_feed(tag_name, function(feed) {
			FuncTools.execute_map(
				feed.entries, function(_single_cb) {
					var entry = this;
					self.store.add_entry(tag_name, entry, _single_cb);
				}, cb
			);
		});
	};

	this.push_state = function(cb) {
		//TODO...
	};

	this.run = function(cb) {
		var self = this;
		this.store.clear();
		this.pull_tags(function () {
			self.store.get_active_tags(function(active_tags) {
				FuncTools.execute_map(
					active_tags, function(_cb) {
						var tag_name = this;
						self.pull_items(tag_name, _cb);
					}, cb
				);
			});
		});
	};
}

