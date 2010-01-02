var domNode = function(e) { return document.createElement(e) };
var textNode= function(e) { return document.createTextNode(e) };

function mkNode(props) {
	if('nodeName' in props) {
		// worst type-check ever?
		return props; // it's already a html element
	}
	if (!props.type) {
		return document.createTextNode(props['text']);
	}
	var node = document.createElement(props.type);
	for(k in props) {
		if(k == 'type') continue;
		if(k == 'text') {
			node.appendChild(document.createTextNode(props[k]));
		} else if (k == 'children') {
			var children = props[k];
			for(var i=0; i < children.length; i++) {
				var child = mkNode(children[i]);
				node.appendChild(child);
			}
		} else {
			if(k.match(/^on/)) {
				// no idea why this would be different...
				node[k] = props[k];
			} else {
				node.setAttribute(k, props[k]);
			}
		}
	}
	return node;
}


function EntryView() {
	this.render = function(e) {
		var body = mkNode({type:'div'});
		body.innerHTML = e.body;

		var header = mkNode({
			type:'h3',
			children: [
				{type:'a', href: e.link, text: e.title},
			],
		});

		var footer = this.toolbar(e);

		var root = mkNode({
			type: 'div',
			children: [header, body, footer],
		});
		
		return root;
	};

	this.toolbar = function(e) {
		return mkNode({
			type:'div',
			class: 'toolbar',
			children: [
				{type:'a', href: '#hello', text: "clicky!"},
			],
		});
	};
}

function EntryListView(ui) {
	this.ui = ui;

	this.render = function(e) {
		var self=this;
		console.log("rendering entry: " + e);
		return mkNode({type: 'div', children: [
			{type: 'a', text:e.title, onclick: function() { self.ui.load_entry(e); }},
		]});
	};
}

function FeedView(ui, entryView) {
	this.ui = ui;

	this.render = function(e) {
		var self = this;
		var result = new Array();
		jQuery.each(e.entries, function() {
			result.push(entryView.render(this));
		});
		return mkNode({type: 'div',
			children: [
				{type: 'div', children: [
					{type: 'a', onclick: function() { self.ui.show_tags(); }, text: '<back'},
					{type:'div', children: result},
				]}
			]
		});
	};
};

function TagView(ui) {
	this.ui = ui;
	this.render = function(e) {
		var name = e;
		var num_items = -1;
		var node = mkNode({
			type:'li',
			class: "tag",
			children: [
				{ type: 'a', onclick: function() { ui.load_tag(name); }, children: [
					{ type: 'span', text: name },
					{ type: 'span', class: 'num_items', text: num_items }
				]}
			],
		});
		return node;
	};
}

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

