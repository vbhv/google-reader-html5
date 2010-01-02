function UI (store){
	this.store = store;
	this.tags_dom = jQuery("#tags");
	this.feed_dom = jQuery("#feed");
	this.entry_dom = jQuery("#entry");
	this.views = {
		entry: new EntryView(this),
		feed: new FeedView(this, new EntryListView(this)),
		tag: new TagView(this),
	};

	this.dom_areas = [this.tags_dom, this.feed_dom, this.entry_dom];

	this.render = function(name, obj) {
		return this.views[name].render(obj);
	}

	this.reload_tags = function() {
		var self=this;
		self.tags_dom.empty();
		jQuery.each(this.store.get_all_tags(), function() {
			self.tags_dom.append(self.render('tag', this));
		});
	};

	this.refresh = function() {
		console.log("UI: refresh...");
		console.log(this.store);
		this.reload_tags();
		//TODO...
	};

	this.load_tag = function(tag_name){
		var self = this;
		reader.get_tag_feed(tag_name, function(feed) {
			self.show_feed_list();
			self.feed_dom.empty().append(self.render('feed', feed));
		});
	};

	this.load_entry = function(tag) {
		this.entry_dom.html(tag.body);
		var self=this;
		this.entry_dom.prepend(mkNode({
			type:'div', children: [
				{type: 'a', text: '^up', onclick: function() { self.show_feed_list(); }},
			]
		}));
		this.show(this.entry_dom);
	};

	this.show_feed_list = function() { this.show(this.feed_dom); };
	this.show_tags = function() { this.show(this.tags_dom); };
	this.show_entry = function() { this.show(this.entry_dom); };

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

