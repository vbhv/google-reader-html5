function UI (store){
	var self=this;
	self.store = store;
	self.tags_dom = jQuery("#tags");
	self.feed_dom = jQuery("#feed");
	self.entry_dom = jQuery("#entry");
	self.active_entry = null;
	self.active_feed = null;
	self.entry_filter = Entry.is_unread;
	self.views = {
		entry: new EntryView(self),
		feed: new FeedView(self, new EntryListView(self)),
		taglist: new TagListView(self, new TagView(self)),
	};

	self.dom_areas = [self.tags_dom, self.feed_dom, self.entry_dom];

	self.render = function(name, obj) {
		return self.views[name].render(obj);
	}

	self.reload_tags = function(cb) {
		self.tags_dom.empty();
		var tags = yield self.store.get_active_tags.result();
		tags = tags.sort_by('key');
		var tags_with_counts = yield self.store.get_tag_counts.result(tags, self.entry_filter);
		self.tags_dom.append(self.render('taglist', tags_with_counts));
		cb();
	};

	self.refresh = function(cb) {
		console.log("UI: refresh...");
		yield self.reload_tags.result();
		//TODO...
		console.log("UI: refresh complete");
		cb();
	};

	self.load_tag = function(tag_name, cb){
		var feed = yield self.store.tag_with_entries.result(tag_name, self.entry_filter);
		self.active_feed = feed;
		feed.entries = feed.entries.sort_by('date');
		self.render_feed(feed, cb);
	};

	self.render_feed = function(feed, cb) {
		if(!feed) {
			feed = self.active_feed;
		}
		self.feed_dom.empty().append(self.render('feed', feed));
		self.show_feed_list();
		cb();
	}

	self.load_entry = function(entry) {
		self.active_entry = entry;
		self.entry_dom.empty().append(self.render('entry', entry));
		self.show(self.entry_dom);
	};

	self.show_feed_list = function() { self.show(self.feed_dom); };
	self.show_tags = function() { self.show(self.tags_dom); };
	self.show_entry = function() { self.show(self.entry_dom); };

	self.show_next = function(current) {
		yield self.set_read.result(current);
		yield self.show_item_offset.result(current, 1);
	}

	self.show_prev = function(current) {
		yield self.show_item_offset.result(current, -1);
	}

	self.show_item_offset = function(current, offset) {
		var item = self.get_item_offset(current, offset);
		if(item == null) {
			yield self.render_feed.result(null);
		} else {
			self.load_entry(item);
		}
	};

	self.get_item_offset = function(current, offset) {
		var all_items = self.active_feed.entries;
		var item_keys = jQuery.map(all_items, function(i) {
			return i.key;
		});
		var index = jQuery.inArray(current.key, item_keys);
		if(index == -1) {
			return null;
		}
		var new_index = index + offset;
		if(new_index < 0 || new_index >= all_items.length) {
			return null;
		}
		return all_items[new_index];
	};

	self.toggle = function(entry, flag, cb) {
		yield self.store.toggle_flag.result(entry, flag);
		self.update_toolbar(entry);
		cb();
	};
		
	self.toggle_read = function(entry) { yield self.toggle.result(entry, 'read'); };
	self.toggle_star = function(entry) { yield self.toggle.result(entry, 'star'); };
	self.set_read = function(entry, cb) { yield self.store.set_flag.result(entry, 'read', true); cb() };

	self.update_toolbar = function(entry) {
		self.load_entry(self.active_entry);
	};

	self.show = function(dom) {
		jQuery.each(self.dom_areas, function() {
			if(this == dom) {
				this.show();
			} else {
				this.hide();
			}
		});
	};

}

