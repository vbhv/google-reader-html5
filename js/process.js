var Processor = function(store) {
	var self = this;
	self.store = store;

	var image_matcher = /(jpe?g|gif|png|tiff)$/i;

	function __imghack_ruin(s) {
		return s.replace(/ src=/g, ' _src=');
	}

	function __imghack_restore(s) {
		return s.replace(/ _src=/g, ' src=');
	}

	this.run = function(entry) {
		var body = jQuery('<div/>').append(__imghack_ruin(entry.body));
		body = this.add_alt_text(body);
		body = this.insert_media(entry, body);
		entry.images = this.extract_image_urls(body);
		entry.body = __imghack_restore(body.html());
		return entry;
	};

	function _subtitle(img) {
		var alt = jQuery(img).attr('alt');
		if (!alt) {
			return null;
		}
		return jQuery(mkNode({type: "div", children: [
			{type: "em", text: alt},
			{type: "p", text: ' '}
		]}));
	}

	function _strip_request(url) {
		return url.split('?')[0];
	};

	function _img(src) {
		return mkNode({type: 'img', _src: src});
	}
	
	this.add_alt_text = function(content) {
		jQuery(content).find("img").each(function() {
			var subtitle = _subtitle(this);
			if(subtitle != null) {
				jQuery(this).after(subtitle);
			}
		});
		return content;
	};

	this.insert_media = function(entry, body) {
		var existing_images = jQuery.map(jQuery('img', body), function(img) {
			return _strip_request(jQuery(img).attr('_src'));
		});
		var images = jQuery.map(entry.media, function(elem) {
			elem = _strip_request(elem);
			var match = image_matcher.exec(elem);
			if(match != null) {
				if(existing_images.indexOf(elem) > -1) {
					return null;
				}
				return mkNode({type:'li', children: [_img(elem)]});
			}
			return null;
		});
		if(images.length > 0) {
			body.append(jQuery(mkNode({type: 'ul', class:'enclosure', children: images})));
		}
		return body;
	};

	this.extract_image_urls = function(content) {
		var top_level_images = [];
		content.each(function() {
			top_level_images = top_level_images.concat(jQuery(this).find('img').get());
		});
		return jQuery.map(top_level_images, function(img) {
			var url = jQuery(img).attr('_src');
			return url ? _strip_request(url) : null;
		});
	};

}.BakeConstructor();


