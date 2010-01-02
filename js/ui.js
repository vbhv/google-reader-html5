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

var ui;
function UI (){
	this.tags = jQuery("#tags");
	this.content = jQuery("#content");
	this.Tag = function(name, num_items) {
		var _this = this;
		var node = mkNode({
			type:'li',
			class: "tag",
			// id: "tag_" + ,
			children: [
				{ type: 'a', onclick: function() { _this.load_tag(name); }, children: [
					{ type: 'span', text: name },
					{ type: 'span', class: 'num_items', text: num_items }
				]}
			],
		});
		this.tags.append(node);
	};

	this.load_tag = function(tag_name){
		var self = this;
		reader.get_tag_feed(tag_name, function(feed) {
			self.tags.hide();
			self.content.empty().append(feed.render());
		});
	};

	this.toggle_sidebar = function() {
		this.tags.toggle();
		this.content.toggle();
	};

}

