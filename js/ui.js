function UI (store){
	var self=this;
	self.store = store;
	self.tags_dom = jQuery("#tags");
	self.feed_dom = jQuery("#feed");
	self.entry_dom = jQuery("#entry");
	self.active_entry = null;
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
		var tags = yield self.store.get_all_tags.result();
		var tags_with_counts = yield self.store.get_tag_counts.result(tags);
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
		var feed = yield self.store.tag_with_entries.result(tag_name);
		self.show_feed_list();
		self.feed_dom.empty().append(self.render('feed', feed));
		cb();
	};

	self.load_entry = function(entry) {
		self.active_entry = entry;
		self.entry_dom.empty().append(self.render('entry', entry));
		self.show(self.entry_dom);
	};

	self.show_feed_list = function() { self.show(self.feed_dom); };
	self.show_tags = function() { self.show(self.tags_dom); };
	self.show_entry = function() { self.show(self.entry_dom); };

	self.toggle = function(entry, flag) {
		self.store.toggle_flag(entry, flag, function(val) {
			self.update_toolbar(entry);
		});
	};
		
	self.toggle_read = function(entry) { self.toggle(entry, 'read'); };
	self.toggle_star = function(entry) { self.toggle(entry, 'star'); };

	self.update_toolbar = function(entry) {
		if(entry == self.active_entry) {
			self.load_entry(entry);
		}
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

