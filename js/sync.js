var Sync = function(reader, store, processor) {
	var self = this;
	self.reader = reader;
	self.store = store;
	self.processor = processor;

	self.pull_tags = function(cb) {
		var tags = yield self.reader.get_user_tags();
		yield self.store.set_valid_tags(tags);
		cb();
	};

	self.pull_items = function(tag_name, cb) {
		var feed = yield self.reader.get_tag_feed(tag_name, null);
		yield map_cb(feed.entries, function(entry, _cb) {
			yield processor.run(entry);
			yield self.store.add_entry(tag_name, entry);
			_cb();
		});
		cb();
	};

	self.push = function(cb) {
		verbose("pushing");
		var pending_actions = yield self.store.pending_actions();
		yield map_cb(pending_actions, function(action, _cb) {
			info("mappy!")
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
			verbose("pushing state [" + name + "=" + value + "] for " + key);
			var success = yield self.reader[func](key, value);
			if(success) {
				yield self.store.remove_action(action);
			} else {
				error("failed pushing state: " + name);
			}
			_cb();
		});
		cb();
	};

	self.run = function(cb) {
		info("SYNC: run()");
		yield self.push();
		info("SYNC: state pushed!");
		self.store.clear();
		info("SYNC: cleared!");
		yield self.pull_tags();
		info("SYNC: tags pulled!");
		var active_tags = yield self.store.get_active_tags();
		verbose("SYNC: there are " + active_tags.length + " active tags");
		yield map_cb(active_tags, function(tag, _cb) {
			yield self.pull_items(tag.key);
			_cb();
		});
		info("SYNC: all done");
		cb();
	};
}.BakeConstructor();
