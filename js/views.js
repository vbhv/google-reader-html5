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
