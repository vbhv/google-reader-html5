function Sync(reader, store) {
	var self = this;
	self.reader = reader;
	self.store = store;

	self.pull_tags = function(cb) {
		var tags = yield self.reader.get_user_tags.result();
		yield self.store.set_valid_tags.result(tags);
		cb();
	};

	self.pull_items = function(tag_name, cb) {
		var feed = yield self.reader.get_tag_feed.result(tag_name, null);
		yield map_cb.result(feed.entries, function(entry, _cb) {
			yield self.store.add_entry.result(tag_name, entry);
			_cb();
		});
		cb();
	};

	self.push = function(cb) {
		console.log("pushing");
		var pending_actions = yield self.store.pending_actions.result();
		yield map_cb.result(pending_actions, function(action, _cb) {
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
				yield self.store.remove_action.result(action);
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
		console.log("SYNC: there are " + active_tags.length + " active tags");
		yield map_cb.result(active_tags, function(tag, _cb) {
			yield self.pull_items.result(tag.key);
			_cb();
		});
		console.log("SYNC: all done");
		cb();
	};
}
