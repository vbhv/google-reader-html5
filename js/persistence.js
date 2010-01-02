function Store(mode) {
	this._table = function(name) {
		return new Lawnchair({table: name, adaptor: mode});
	};

	this.valid_tags = this._table('tags');
	this.tags = this._table('tag_store');
	this.feeds = this._table('feeds');
	this.items = this._table('items');
	this.resources = this._table('res');

	this.set_valid_tags = function(tags, cb) {
		this.valid_tags.nuke();
		var self = this;
		var remaining_tags = tags.length;
		jQuery.each(tags, function() {
			var tag_name = this;
			self.valid_tags.save({key:tag_name});
			self.tag(tag_name, function(tag_store) {
				remaining_tags -= 1;
				if(tag_store == null) {
					remaining_tags += 1;
					tag_store = {key:tag_name};
					self.tags.save(tag_store, function() {
						console.log("STORE: added tag: " + tag_name + " ( " + remaining_tags + " left)");
						remaining_tags -= 1;
						if(remaining_tags == 0) cb();
					});
				} else {
					if(remaining_tags == 0) cb();
				}
			});
		});
	};

	this.get_all_tags = function() {
		var res = new Array();
		this.valid_tags.each(function(e) {
			res.push(e.key);
		});
		return res;
	};

	this.get_active_tags = function() {
		var res = new Array();
		this.valid_tags.each(function(e) {
			res.push(e.key);
		});
		return res;
	};

	this.entries = function(tag, cb) {
		this.tag(tag, function(tag) { cb(tag.entries); });
	};

	this.add_entry = function(tag_name, entry, cb) {
		var self=this;
		this.tag(tag_name, function(tag) {
			tag.entries[entry.id] = entry;
			self.tags.save(tag, cb);
		});
	};

	this.tag = function(tag_name, cb) {
		this.tags.get(tag_name, function(tag) {
			if (!tag) { cb(null) }
			if(!('entries' in tag)) {
				tag.entries = [];
			}
			cb(tag);
		});
	};

}
