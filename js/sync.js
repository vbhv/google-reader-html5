function Sync(reader, store) {
	var self = this;
	self.reader = reader;
	self.store = store;

	self.pull_tags = function(cb) {
		var tags = yield self.reader.get_user_tags.result();
		yield self.store.set_valid_tags.result(tags);
		console.log("got all the tags, yo");
		cb();
	};

	self.pull_items = function(tag_name, cb) {
		self.reader.get_tag_feed(tag_name, function(feed) {
			FuncTools.execute_map(
				feed.entries, function(_single_cb) {
					var entry = this;
					self.store.add_entry(tag_name, entry, _single_cb);
				}, cb
			);
		});
	};

	self.push = function(cb) {
		console.log("pushing");
		var pending_actions = yield self.store.pending_actions.result();
		yield map_cb.result(pending_actions, function(_cb) {
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
			var success = yield self.reader[func].result(key, value);
			if(success) {
				yield self.store.remove_action(action);
			} else {
				console.log("failed: " + name);
			}
			_cb();
		});
		cb();
	};

	self.run = function(cb) {
		console.log("SYNC: run()");
		yield self.push.result();
		console.log("SYNC: state pushed!");
		self.store.clear();
		console.log("SYNC: cleared!");
		yield self.pull_tags.result();
		console.log("SYNC: tags pulled!");
		var active_tags = yield self.store.get_active_tags.result();
		jQuery.each(active_tags, function() {
			var tag_name = this.key;
			yield self.pull_items(tag_name);
		});
		cb();
	};
}
