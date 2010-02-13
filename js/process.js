var Processor = function(store) {
	var self = this;
	self.store = store;

	var image_matcher = /^(.*\.(jpe?g|gif|png|tiff))(\?.*)$/i;

	this.run = function(entry, cb) {
		var body = jQuery('<div/>').append(entry.body);
		this.extract_image_urls(body);
		body = yield this.add_alt_text(body);
		yield this.insert_media(entry, body);
		entry.body = body.html();
		cb();
	};

	function _subtitle(img) {
		return jQuery(mkNode({type: "div", children: [
			{type: "em", text: jQuery(img).attr('alt')},
			{type: "p", text: ' '}
		]}));
	}

	function _img(src) {
		return jQuery(mkNode({type: 'img', src: src}));
	}
	
	this.add_alt_text = function(content) {
		console.log("content: " + content)
		jQuery(content).find("img").each(function() {
			console.log("img: " + this)
			jQuery(this).after(_subtitle(this));
		});
		return content;
	};

	this.insert_media = function(entry, body, cb) {
		entry.media.each(function() {
			var match = image_matcher.exec(this);
			if(match != null) {
				jQuery(body).append(_img(match[1]));
			}
		});
	};

	this.extract_image_urls = function(content) {
		var top_level_images = [];
		content.each(function() {
			top_level_images = top_level_images.concat(jQuery(this).find('img').get());
		});
		return jQuery.map(top_level_images, function(img) {
			return jQuery(img).attr('src');
		});
	};

}.BakeConstructor();


