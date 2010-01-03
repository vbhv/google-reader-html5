function Store(mode) {
	this._table = function(name) {
		return new Lawnchair({table: name, adaptor: mode});
	};

	this.valid_tags = this._table('tags');
	this.tags = this._table('tag_store');
	this.feeds = this._table('feeds');
	this.items = this._table('items');
	this.resources = this._table('res');

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
						tag_store = {key:tag_name};
						self.tags.save(tag_store, function() {
							console.log("STORE: added tag: " + tag_name);
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
		this.valid_tags.all(function(tags) {
			cb(jQuery.map(tags, function(tag){ return tag.key; }));
		});
	};

	this.get_active_tags = function(cb) {
		this.valid_tags.all(function(tags) {
			cb(jQuery.map(tags, function(tag){ return tag.key; }));
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
			if(jQuery.inArray(entry.id, tag.entries) == -1) {
				tag.entries.push(entry.id);
				entry.key = entry.id;
				self.items.save(entry, function() {
					self.tags.save(tag, cb);
				});
			} else {
				cb();
			}
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
