Lawnchair = Lawnchair.BakeConstructor();

Store = function(mode) {
	var self = this;

	var entry_converter = {
		on_save: function(e) {
			delete e.date;
		},

		on_load: function(e) {
			e.date = new Date(e.timestamp);
		}
	};

	var null_filter = function() { return true; };

	self._table = function(name, filters) {
		return new Lawnchair({table: name, adaptor: mode});
	};

	self.tags = self._table('tags');
	self.feeds = self._table('feeds');
	self.items = self._table('items');
	self.resources = self._table('res');
	self.action_store = self._table('actions');

	self.isEmpty = function(cb) {
		tags = yield self.tags.all();
		cb(tags.length == 0);
	};

	self.clear = function() {
		jQuery.each([
			self.tags,
			self.feeds,
			self.items,
			self.resources,
		], function() { this.nuke(); });
	};
	

	self.set_valid_tags = function(tag_names, cb) {
		// remove deleted tags
		current_tags = yield self.tags.all();
		jQuery.each(current_tags, function() {
			var current_tag = this;
			if(!in_array(current_tag.id, tag_names)) {
				self.tags.remove(current_tag);
			}
		});

		// and add new tags
		yield map_cb(tag_names, function(tag_name, _cb) {
			var tag = yield self.tags.get(tag_name);
			if(tag == null) {
				yield self.tags.save({key:tag_name, entries:[]});
			}
			debug("added feed: " + tag_name);
			_cb();
		});
		cb();
	};

	self.get_all_tags = function(cb) {
		var tags = yield self.tags.all();
		cb(tags);
	};

	self.get_active_tags = function(cb) {
		var tags = yield self.tags.all();
		cb(tags);
	};

	self.get_tag_counts = function(tags, filter, cb) {
		var all_items = yield self.items.all();
		all_items = all_items.filter(filter);

		// init tag_counts array
		var tag_counts = {};
		jQuery.each(tags, function () {
			tag_counts[this.key] = 0;
		});

		// add item counts to each of their tags
		jQuery.each(all_items, function() {
			var item = this;
			jQuery.each(item.state.tags, function() {
				var tag = this;
				tag_counts[tag] += 1;
			});
		});

		// make tuples (to return, keeping tag ordering)
		var tags_with_counts = jQuery.map(tags, function(tag) {
			return {tag:tag, count:tag_counts[tag.key]};
		});
		cb(tags_with_counts);
	};

	self.tag_with_entries = function(tag_name, filter, cb) {
		var tag = yield self.tag(tag_name);
		var entries = yield map_cb(tag.entries, function(entry, _cb) {
			entry = yield self.items.get(entry);
			entry_converter.on_load(entry);
			_cb(entry);
		});
		entries = entries.filter(filter);
		tag.entries = entries;
		cb(tag);
	};

	self.add_entry = function(tag_name, entry, cb) {
		var tag = yield self.tag(tag_name);
		if(tag == null) {
			warn("no such tag: " + JSON.stringify(tag_name));
		} else {
			if(!in_array(entry.id, tag.entries)) {
				tag.entries.push(entry.id);
				entry.key = entry.id;
				entry_converter.on_save(entry);
				yield self.items.save(entry);
				verbose("addded item " + entry.id + " to tag " + tag.key + " and now it has " + tag.entries.length);
				yield self.tags.save(tag);
			}
		}
		cb();
	};

	self.toggle_flag = function(entry, flag, cb) {
		verbose("toggling flag: " + flag + " on entry " + entry);
		var val = !(entry.state[flag] || false); // get it, then flip it
		yield self.set_flag(entry, flag, val);
		cb(val);
	};

	self.set_flag = function(entry, flag, val, cb) {
		info("setting flag: " + flag + " to " + val + " on entry " + entry);
		entry.state[flag] = val;
		entry_converter.on_save(entry);
		yield self.items.save(entry);
		yield self.add_action(flag, entry.id, val);
		cb();
	};

	self.add_action = function(action, key, value, cb) {
		var _arguments = Array.prototype.slice.call(arguments);
		var cb = _arguments.slice(-1)[0];
		var args = _arguments.slice(0,-1);
		self.modify_actions(function(actions) {
			actions.push(args);
			debug("added action: " + args);
		}, cb);
	};

	self.remove_action = function(params, cb) {
		self.modify_actions(function(actions) {
			var index = in_array(params, actions);
			if(index !== false) {
				actions.splice(index, 1); // remove 1 elem from index
			} else {
				debug("all actions: " + JSON.stringify(actions));
				error("action not found to delete: " + JSON.stringify(params));
			}
		}, cb);
	};

	self.collapse_actions = function(cb) {
		var reversible = ['read','star'];
		var blacklist = [];
		self.modify_actions(function(actions) {
			var unique_actions = [];
			jQuery.each(actions, function(i) {
				var action = this;
				if(in_array(i, blacklist) !== false) {
					return;
				}
				var remaining_actions = actions.slice(i);
				if(in_array(action[0], reversible) === false) {
					unique_actions.push(action);
					return;
				}
				var opposite = action.slice();
				opposite[2] = !opposite[2];
				var opposite_index = in_array(opposite, remaining_actions);
				if(opposite_index === false) {
					unique_actions.push(action);
				} else {
					verbose("dropping action: " + action + " (" + i + ") && " + actions[opposite_index + i] + "( " + (opposite_index + i) + ")");
					blacklist.push(opposite_index + i);
				}
			});
			return unique_actions;
		}, cb);
	};

	self.modify_actions = function(_do, cb) {
		self._get_action_info(function(action_info) {
			var retval = _do(action_info.values);
			if (retval instanceof Array) {
				action_info.values = retval;
			}
			self.action_store.save(action_info, cb);
		});
	};

	self._get_action_info = function(cb) {
		self.action_store.get(1, function(action_info) {
			if(action_info == null) {
				action_info = {key:1, values:[]};
			}
			cb(action_info);
		});
	};
		

	self.pending_actions = function(cb) {
		var collapsed = yield self.collapse_actions();
		collapsed = yield self._get_action_info();
		cb(collapsed.values);
	};

	self.tag = function(tag_name, cb) {
		var tag = yield self.tags.get(tag_name);
		if (!tag) {
			cb(null);
		} else {
			if(!('entries' in tag)) {
				tag.entries = [];
			}
			cb(tag);
		}
	};

}.BakeConstructor();
