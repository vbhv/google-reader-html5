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
		console.log("downloading tag " + tag_name);
		var self = this;
		this.reader.get_tag_feed(tag_name, function(feed) {
			var num = feed.entries.length;
			jQuery.each(feed.entries, function() {
				var entry = this;
				self.store.add_entry(tag_name, entry, function() {
					num -= 1;
					if(num == 0) { cb(); }
				});
			});
		});
	};

	this.push_state = function(cb) {
		//TODO...
	};

	this.run = function(cb) {
		var self = this;
		this.pull_tags(function () {
			var active_tags = self.store.get_active_tags();
			var remaining_tags = active_tags.length;
			jQuery.each(active_tags, function() {
				var tag_name = this;
				console.log("getting tag: " + tag_name + " - (" + remaining_tags + " left)");
				self.pull_items(tag_name, function() {
					remaining_tags -= 1;
					console.log("SYNC: got " + tag_name + " - " + remaining_tags + " tags left to sync");
					if(remaining_tags == 0) {
						cb();
					}
				});
			});
		});
	};
}

