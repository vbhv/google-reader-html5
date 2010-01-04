function UI (store){
	this.store = store;
	this.tags_dom = jQuery("#tags");
	this.feed_dom = jQuery("#feed");
	this.entry_dom = jQuery("#entry");
	this.active_entry = null;
	this.views = {
		entry: new EntryView(this),
		feed: new FeedView(this, new EntryListView(this)),
		taglist: new TagListView(this, new TagView(this)),
	};

	this.dom_areas = [this.tags_dom, this.feed_dom, this.entry_dom];

	this.render = function(name, obj) {
		return this.views[name].render(obj);
	}

	this.reload_tags = function(cb) {
		var self=this;
		self.tags_dom.empty();
		this.store.get_all_tags(function(tags) {
			self.store.get_tag_counts(tags, function(tags_with_counts) {
				self.tags_dom.append(self.render('taglist', tags_with_counts));
				cb();
			});
		});
	};

	this.refresh = function(cb) {
		console.log("UI: refresh...");
		this.reload_tags(cb || function(){});
		//TODO...
	};

	this.load_tag = function(tag_name){
		var self = this;
		self.store.tag_with_entries(tag_name, function(feed) {
			self.show_feed_list();
			self.feed_dom.empty().append(self.render('feed', feed));
		});
	};

	this.load_entry = function(entry) {
		this.active_entry = entry;
		this.entry_dom.empty().append(this.render('entry', entry));
		this.show(this.entry_dom);
	};

	this.show_feed_list = function() { this.show(this.feed_dom); };
	this.show_tags = function() { this.show(this.tags_dom); };
	this.show_entry = function() { this.show(this.entry_dom); };

	this.toggle = function(entry, flag) {
		var self=this;
		this.store.toggle_flag(entry, flag, function(val) {
			self.update_toolbar(entry);
		});
	};
		
	this.toggle_read = function(entry) { this.toggle(entry, 'read'); };
	this.toggle_star = function(entry) { this.toggle(entry, 'star'); };

	this.update_toolbar = function(entry) {
		if(entry == this.active_entry) {
			this.load_entry(entry);
		}
	};

	this.show = function(dom) {
		jQuery.each(this.dom_areas, function() {
			if(this == dom) {
				this.show();
			} else {
				this.hide();
			}
		});
	};

}

