var Sync = function(reader, store, processor) {
	var self = this;
	self.reader = reader;
	self.store = store;
	self.processor = processor;
	self.busy = false;

	self.pull_tags = function(cb) {
		var tags = yield self.reader.get_user_tags();
		yield self.store.set_valid_tags(tags);
		cb();
	};

	self.pull_items = function(tag_name, cb) {
		verbose("grabbing tag feed: " + tag_name);
		var feed = yield self.reader.get_tag_feed(tag_name, null);
		verbose("processing entries...");
		yield map_cb(feed.entries, function(entry, _cb) {
			processor.run(entry);
			yield self.store.add_entry(tag_name, entry);
			_cb();
		});
		cb();
	};

	self._push = function(cb) {
		verbose("pushing");
		var pending_actions = yield self.store.pending_actions();
		var progress = new ProgressBar(pending_actions.length, "pushing status");
		yield map_cb(pending_actions, function(action, _cb) {
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
			progress.add(1);
			_cb();
		});
		verbose("removing read items");
		yield self.store.delete_read_items();
		verbose("removing unused images");
		yield self.store.remove_unused_images();
		progress.remove();
		verbose("push complete");
		cb();
	};

	self._run = function(cb) {
		info("SYNC: run()");
		yield self._push();
		info("SYNC: state pushed!");
		self.store.clear();
		info("SYNC: cleared!");
		yield self.pull_tags();
		info("SYNC: tags pulled!");
		var active_tags = yield self.store.get_active_tags();
		if(TAG_FILTER && TAG_FILTER.length > 0) {
			info("filtering tags to just " + JSON.stringify(TAG_FILTER));
			active_tags = active_tags.filter(function(tag) {
				return TAG_FILTER.indexOf(tag.key) != -1;
			});
		}
		verbose("SYNC: there are " + active_tags.length + " active tags");
		var progress = new ProgressBar(active_tags.length, "downloading tags");
		yield map_cb(active_tags, function(tag, _cb) {
			progress.add(1);
			yield self.pull_items(tag.key);
			debug("tag " + tag.key + " downloaded");
			_cb();
		});
		progress.remove()
		debug("setting up a callback to mirror images...");
		window.setTimeout(function() {
			self.mirror_images(NULL_CB);
		},100);
		info("SYNC: all done");
		cb();
	};

	self.mirror_images = function(cb) {
		var missing_images = yield self.store.missing_images();
		if(missing_images.length == 0) { cb(); return; }
		var progress = new ProgressBar(missing_images.length, "downloading images");
		var get_next_image = function() {
			if(missing_images.length == 0) {
				progress.remove();
				cb();
			}
			var url = missing_images.shift();
			progress.add(1);

			debug("downloading image: " + url);
			GET(url, null, function(data) {
				debug("download image: " + url);
				self.store.save_image({
					key: url,
					data: data,
				}, get_next_image);
			}, get_next_image);
		};
		get_next_image();
	};

	self.push = function(cb) {
		self.locked(function(_cb){
			self._push(_cb);
		}.bake(self), cb);
	};

	self.run = function(cb) {
		self.locked(function(_cb){
			self._run(_cb);
		}.bake(self), cb);
	};

	self.locked = function(func, cb) {
		if(self.busy) {
			info(this + " is busy");
			return cb();
		} else {
			self.busy = true;
			return func.call(this, function() {
				self.busy = false;
				cb.apply(this, arguments);
			});
		}
	};


}.BakeConstructor();
