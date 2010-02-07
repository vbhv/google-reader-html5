var domNode = function(e) { return document.createElement(e) };
var textNode= function(e) { return document.createTextNode(e) };

function plural(num, singular, pl) {
	return num == 1 ? singular : pl;
}

function relative_date(d) {
	if(!d) { return "";}
	var now = new Date();
	var time_diff = now.getTime() - d.getTime();
	time_diff = time_diff / 1000; // make seconds
	var day_diff = Math.round(time_diff / (60 * 60 * 24));
	function _compose(num, unit) {
		return num + " " + unit + " ago";
	}
	if(day_diff == 0) return "today";
	if(day_diff < 0) return "in the future";
	if(day_diff < 7) {
		return day_diff + " " + plural(day_diff, "day", "days") + " ago";
	}
	var week_diff = Math.round(day_diff / 7);
	return week_diff + " " + plural(week_diff, "week", "weeks") + " ago";
}

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


var funcd = function(func) {
	var args = Array.prototype.slice.call(arguments, 1);
	args.push(function(){});
	return function() {
		async(func).apply(null, args);
	};
};

function EntryView(ui) {
	this.ui = ui;

	this.render = function(e) {
		var self=this;
		var body = mkNode({type:'div', class:'content'});
		body.innerHTML = e.body;

		var header = mkNode({
			type:'div', children: [
				{
					type:'div',
					class: 'toolbar',
					children: [
						{type: 'a', text: '<<', onclick: funcd(self.ui.show_prev, e) },
						{type: 'a', text: '>>', onclick: funcd(self.ui.show_next, e) },
						{type: 'a', text: '^up', onclick: funcd(self.ui.render_feed, null)},
						{type: 'a', text: (e.state.read ? 'keep' : 'mark read'), onclick: funcd(self.ui.toggle_read, e) },
						{type: 'a', text: (e.state.star ? '-' : '+') + ' star', onclick: funcd(self.ui.toggle_star, e) },
					]
				},
				{type:'div', class:'post-info header', children: [
					{
						type:'h1',
						children: [
							{type:'a', href: e.link, text: e.title},
						],
					},
				]},
			]
		});

		var footer = mkNode({
			type:'p',
			class: 'post-info footer',
			text: "posted " + relative_date(e.date) + " in tag {TAG}",
		});

		var root = mkNode({
			type: 'div',
			children: [header, body, footer],
		});
		
		return root;
	};

}

function EntryListView(ui) {
	this.ui = ui;

	this.render = function(e) {
		var self=this;
		console.log("entry " + e.title + " is " + e.state.read);
		return mkNode({
			type: 'li',
			class:"entry-summary " + (e.state.read ? "read" : "unread"),
			onclick: funcd(self.ui.load_entry, e),
			children: [
				{type: 'a', text:e.title},
				{type: 'span', class:'date', text:relative_date(e.date)},
			]
		});
	};
}

function FeedView(ui, entryView) {
	this.ui = ui;

	this.render = function(e) {
		var self = this;
		console.log("rendering feed: " + e.key);

		var result = jQuery.map(e.entries, function(entry) {
			return entryView.render(entry);
		});
		return mkNode({type: 'div',
			children: [
				{type: 'div', children: [
					{
						type: 'div',
						class: 'toolbar',
						children: [
							{type: 'a', onclick: funcd(self.ui.show_tags), text: '<back'},
						]
					},
					{type:'ul', children: result},
				]}
			]
		});
	};
};

function TagListView(ui, tagView) {
	this.ui = ui;
	this.tagView = tagView;

	this.render = function(e) {
		var children = jQuery.map(e, this.tagView.render);
		return mkNode({
			type:'div',
			children: [
				{
					type:'div',
					class: 'toolbar',
					children: [
						{ type: 'a', text: 'sync', onclick: funcd(app.do_sync, true), },
						{ type: 'a', text: 'push', onclick: funcd(app.do_sync, false), },
						{ type: 'a', text: 'clear', onclick: funcd(app.clear_and_sync, false), },
						{ type: 'a', text: 'show read', onclick: funcd(app.toggle_show_read, false), },
					],
				},
				{
					type: 'ul',
					children: children,
				},
			],
		});

	};
}

function TagView(ui) {
	this.ui = ui;
	this.render = function(e) {
		var tag = e[0];
		var num_items = e[1];
		var name = tag.key;
		var node = mkNode({
			type:'li',
			class: "tag ",
			children: [
				{ type: 'a', onclick: funcd(ui.load_tag, name), children: [
					{ type: 'span', text: name },
					{ type: 'span', class: 'num_items', text: num_items }
				]}
			],
		});
		return node;
	};
}
