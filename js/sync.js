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

	this.push = function(cb) {
		var self = this;
		this.store.pending_actions(function(actions) {
			FuncTools.execute_map(actions, function(_cb) {
				var action = this;
				var name = action[0];
				var key = action[1];
				var value = action[2]; //optional, but javascript doesn't care
				var func = null;
				if(name == 'star') func = 'set_star';
				if(name == 'read') func = 'set_read';
				if(name == 'share') func = 'set_public';
				if (func == null) {
					alert("unknown action: " + name);
					return;
				}
				console.log("pushing state [" + name + "=" + value + "] for " + key);
				self.reader[func](key, value, function(success) {
					if(success) {
						this.store.remove_action(action, _cb);
					} else {
						console.log("failed: " + name);
						_cb();
					}
				});
			}, cb);
		});
	};

	this.run = function(cb) {
		var self = this;
		self.push(function() {
			console.log("SYNC: state pushed!");
			// self.store.clear();
			self.pull_tags(function () {
				self.store.get_active_tags(function(active_tags) {
					FuncTools.execute_map(
						active_tags, function(_cb) {
							var tag_name = this;
							self.pull_items(tag_name, _cb);
						}, cb
					);
				});
			});
		});
	};
}

