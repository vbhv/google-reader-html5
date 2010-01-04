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
	this._table = function(name) {
		return new Lawnchair({table: name, adaptor: mode});
	};

	this.tags = this._table('tags');
	this.feeds = this._table('feeds');
	this.items = this._table('items');
	this.resources = this._table('res');
	this.action_store = this._table('actions');

	this.ifEmpty = function(ifTrue, ifFalse) {
		this.tags.all(function(tags) {
			if(tags.length == 0) {
				ifTrue();
			} else {
				ifFalse();
			}
		});
	};

	this.clear = function() {
		jQuery.each([
			this.tags,
			this.feeds,
			this.items,
			this.resources,
		], function() { this.nuke(); });
	};
	

	this.set_valid_tags = function(tag_names, cb) {
		var self = this;
		// remove deleted tags
		this.tags.all(function(current_tags) {
			jQuery.each(current_tags, function(_cb) {
				var current_tag = this;
				if(!jQuery.inArray(current_tag.id, tag_names)) {
					self.tags.remove(current_tag);
				}
			});
			// and add new tags
			FuncTools.execute_map(tag_names, function(_cb) {
				var tag_name = this;
				self.tags.get(tag_name, function(tag) {
					if(tag == null) {
						self.tags.save({key:tag_name, entries:[]}, _cb);
					} else {
						_cb();
					}
				});
			}, cb);
		});
	};

	this.get_all_tags = function(cb) {
		this.tags.all(function(tags) {
			cb(tags);
		});
	};

	this.get_active_tags = function(cb) {
		this.tags.all(function(tags) {
			cb(tags);
		});
	};

	this.get_tag_counts = function(tags, cb) {
		var self = this;
		var tags_with_counts = [];
		FuncTools.execute_map(tags, function(_cb) {
			var tag = this;
			self.tag_count(tag, function(count) {
				tags_with_counts.push([tag,count]);
				_cb();
			});
		}, function() { cb(tags_with_counts); });
	};

	this.tag_count = function(tag, cb) {
		var self=this;
		self.items.all(function(items) {
			var count = 0;
			console.log("item count = " + items.length);
			jQuery.each(items, function() {
				if(jQuery.inArray(tag.id, this.state.tags)) {
					count += 1;
				}
			});
			cb(count);
		});
	};

	this.tag_with_entries = function(tag, cb) {
		var self=this;
		this.tag(tag, function(tag) {
			var entries = [];
			FuncTools.execute_map(tag.entries, function(_cb) {
				self.items.get(this, function(entry) {
					entries.push(entry);
					_cb();
				});
			}, function() {
				tag.entries = entries;
				cb(tag);
			});
		});
	};

	this.add_entry = function(tag_name, entry, cb) {
		var self=this;
		this.tag(tag_name, function(tag) {
			if(tag == null) {
				console.log("no such tag: " + tag_name);
			}
			if(jQuery.inArray(entry.id, tag.entries) == -1) {
				tag.entries.push(entry.id);
				entry.key = entry.id;
				self.items.save(entry, function() {
					console.log("addded item " + entry.id + " to tag " + tag.key + " and now it has " + tag.entries.length);
					self.tags.save(tag, cb);
				});
			} else {
				cb();
			}
		});
	};

	this.toggle_flag = function(entry, flag, cb) {
		console.log("adding flag: " + flag + " to entry " + entry);
		var val = !(entry.state[flag] || false); // get it, then flip it
		entry.state[flag] = val;
		var self = this;
		this.items.save(entry, function() {
			self.add_action(flag, entry.id, val, function() {
				cb(val);
			});
		});
	};

	this.add_action = function(action, key, value, cb) {
		var _arguments = Array.prototype.slice.call(arguments);
		var cb = _arguments.slice(-1)[0];
		var args = _arguments.slice(0,-1);
		this.modify_actions(function(actions) {
			actions.push(args);
			console.log("added action: " + args);
		}, cb);
	};

	this.remove_action = function(params, cb) {
		this.modify_actions(function(actions) {
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

	this.collapse_actions = function(cb) {
		var reversible = ['read','star'];
		var blacklist = [];
		this.modify_actions(function(actions) {
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

	this.modify_actions = function(_do, cb) {
		var self = this;
		self._get_action_info(function(action_info) {
			var retval = _do(action_info.values);
			if (retval instanceof Array) {
				action_info.values = retval;
			}
			self.action_store.save(action_info, cb);
		});
	};

	this._get_action_info = function(cb) {
		this.action_store.get(1, function(action_info) {
			if(action_info == null) {
				action_info = {key:1, values:[]};
			}
			cb(action_info);
		});
	};
		

	this.pending_actions = function(cb) {
		var self=this;
		this.collapse_actions(function() {
			self._get_action_info(function(action_info) {
				cb(action_info.values);
			});
		});
	};

	this.tag = function(tag_name, cb) {
		this.tags.get(tag_name, function(tag) {
			if (!tag) { return cb(null); }
			if(!('entries' in tag)) {
				tag.entries = [];
			}
			cb(tag);
		});
	};

}
