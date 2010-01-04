function Store(mode) {
	this._table = function(name) {
		return new Lawnchair({table: name, adaptor: mode});
	};

	this.valid_tags = this._table('tags');
	this.tags = this._table('tag_store');
	this.feeds = this._table('feeds');
	this.items = this._table('items');
	this.resources = this._table('res');
	this.action_store = this._table('actions');

	this.ifEmpty = function(ifTrue, ifFalse) {
		this.valid_tags.all(function(tags) {
			if(tags.length == 0) {
				ifTrue();
			} else {
				ifFalse();
			}
		});
	};

	this.clear = function() {
		jQuery.each([
			this.valid_tags,
			this.tags,
			this.feeds,
			this.items,
			this.resources,
		], function() { this.nuke(); });
	};
	

	this.set_valid_tags = function(tags, cb) {
		this.valid_tags.nuke();
		var self = this;
		FuncTools.execute_map(tags, function(_cb) {
			var tag_name = this;
			self.valid_tags.save({key:tag_name}, function() {
				self.tag(tag_name, function(tag_store) {
					if(tag_store == null) {
						tag_store = {key:tag_name, unread_count:0};
						self.tags.save(tag_store, function() {
							_cb();
						});
					} else {
						_cb();
					}
				});
			});
		}, cb);
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
				if(!('unread' in tag)) {
					tag.unread = 0;
				}
				tag.unread += 1;
				entry.key = entry.id;
				self.items.save(entry, function() {
					self.tags.save(tag, cb);
				});
			} else {
				cb();
			}
		});
	};

	this.propagate_flag = function(entry, flag, newval, cb) {
		var self=this;
		if(flag == 'read') {
			var amount = newval ? 1 : -1;
			this.tag_store.all(function(tags) {
				FuncTools.execute_map(tags, function(_cb) {
					if(jQuery.inArray(entry.id, this.entries)) {
						this.unread += amount;
						self.tag_store.save(this, _cb);
					} else {
						// nothing to do
						_cb();
					}
				}, cb);
			});
		}
	};

	this.toggle_flag = function(entry, flag, cb) {
		console.log("adding flag: " + flag + " to entry " + entry);
		var val = !(entry[flag] || false); // get it, then flip it
		entry[flag] = val;
		var self = this;
		this.items.save(entry, function() {
			self.propagate_flag(entry, flag, val, function() {
				self.add_action(flag, entry.id, val, function() {
					cb(val);
				});
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
		function eq(a, b) {
			if(a == b) return true;
			if(!('length' in a && 'length' in b)) return false; // not an array
			if(a.length != b.length) return false;
			for(var i=0; i<a.length; i++) {
				if(!eq(a[i], b[i])) {
					console.log("elem " + i + " not equal");
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

		//FIXME: never seems to match an action...
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

	this.modify_actions = function(_do, cb) {
		var self = this;
		self._get_action_info(function(action_info) {
			_do(action_info.values);
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
		this._get_action_info(function(action_info) {
			cb(action_info.values);
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
