function eq(a, b) {
	if(a == b) return true;
	if(!(a instanceof Array && b instanceof Array)) return false; // not an array
	if(a.length != b.length) return false;
	for(var i=0; i<a.length; i++) {
		if(!eq(a[i], b[i])) {
			return false;
		}
	}
	return true;
}

function in_array(needle, haystack) {
	for(var i = 0; i<haystack.length; i++) {
		if (eq(needle, haystack[i])) {
			return i;
		}
	}
	return false;
}

function Store(mode) {
	var self = this;
	self._table = function(name) {
		var lawnchair = new Lawnchair({table: name, adaptor: mode});
		return baked_instance(lawnchair);
	};

	self.tags = self._table('tags');
	self.feeds = self._table('feeds');
	self.items = self._table('items');
	self.resources = self._table('res');
	self.action_store = self._table('actions');

	self.isEmpty = function(cb) {
		tags = yield self.tags.all.result();
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
		console.log("validing feeds");
		current_tags = yield self.tags.all.result();
		jQuery.each(current_tags, function() {
			var current_tag = this;
			if(!in_array(current_tag.id, tag_names)) {
				self.tags.remove(current_tag);
			}
		});
		console.log("validing feeds: " + tag_names);
		// and add new tags

		yield map_cb.result(tag_names, function(tag_name, _cb) {
			var tag = yield self.tags.get.result(tag_name);
			if(tag == null) {
				console.log("adding feed");
				yield self.tags.save.result({key:tag_name, entries:[]});
			}
			console.log("added feed: " + tag_name);
			_cb();
		});
		cb();
	};

	self.get_all_tags = function(cb) {
		var tags = yield self.tags.all.result();
		cb(tags);
	};

	self.get_active_tags = function(cb) {
		var tags = yield self.tags.all.result();
		cb(tags);
	};

	self.get_tag_counts = function(tags, cb) {
		var tags_with_counts = yield map_cb.result(tags, function(tag, _cb) {
			var count = yield self.tag_count.result(tag);
			_cb([tag,count]);
		});
		cb(tags_with_counts);
	};

	self.tag_count = function(tag, cb) {
		var items = yield self.items.all.result();
		var count = 0;
		jQuery.each(items, function() {
			if(in_array(tag.key, this.state.tags) !== false) {
				count += 1;
			}
		});
		cb(count);
	};

	self.tag_with_entries = function(tag_name, cb) {
		var tag = yield self.tag.result(tag_name);
		var entries = yield map_cb.result(tag.entries, function(entry, _cb) {
			_cb(yield self.items.get.result(entry));
		});
		tag.entries = entries;
		cb(tag);
	};

	self.add_entry = function(tag_name, entry, cb) {
		var tag = yield self.tag.result(tag_name);
		if(tag == null) {
			console.log("no such tag: " + JSON.stringify(tag_name));
		} else {
			if(!in_array(entry.id, tag.entries)) {
				tag.entries.push(entry.id);
				entry.key = entry.id;
				yield self.items.save.result(entry);
				console.log("addded item " + entry.id + " to tag " + tag.key + " and now it has " + tag.entries.length);
				yield self.tags.save.result(tag);
			}
		}
		cb();
	};

	self.toggle_flag = function(entry, flag, cb) {
		console.log("adding flag: " + flag + " to entry " + entry);
		var val = !(entry.state[flag] || false); // get it, then flip it
		entry.state[flag] = val;
		yield self.items.save.result(entry);
		yield self.add_action(flag, entry.id, val);
		cb(val);
	};

	self.add_action = function(action, key, value, cb) {
		var _arguments = Array.prototype.slice.call(arguments);
		var cb = _arguments.slice(-1)[0];
		var args = _arguments.slice(0,-1);
		self.modify_actions(function(actions) {
			actions.push(args);
			console.log("added action: " + args);
		}, cb);
	};

	self.remove_action = function(params, cb) {
		self.modify_actions(function(actions) {
			var index = in_array(params, actions);
			if(index !== false) {
				actions.splice(index, 1); // remove 1 elem from index
			} else {
				console.log("all actions: " + JSON.stringify(actions));
				console.log("ERROR: action not found to delete: " + JSON.stringify(params));
				alert("ERROR: action not found to delete: " + JSON.stringify(params));
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
				console.log(JSON.stringify(action));
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
					console.log("dropping action: " + action + " (" + i + ") && " + actions[opposite_index + i] + "( " + (opposite_index + i) + ")");
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
		var collapsed = yield self.collapse_actions.result();
		collapsed = yield self._get_action_info.result();
		cb(collapsed.values);
	};

	self.tag = function(tag_name, cb) {
		var tag = yield self.tags.get.result(tag_name);
		if (!tag) {
			cb(null);
		} else {
			if(!('entries' in tag)) {
				tag.entries = [];
			}
			cb(tag);
		}
	};

}
