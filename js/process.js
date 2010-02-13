function Process() {
	var self = this;

	this.run(entry, cb) {
		var body = jQuery(entry.body);
		yield this.extract_image_urls(body);
		body = yield this.add_alt_text(body);
		yield this.insert_media(entry, body);
		entry.body = body.toString();
		cb();
	};

	function _subtitle(img) {
		return jQuery("<em>" + img.attr('src') + "</em>");
	}
	
	this.add_alt_text = function(content, cb) {
		content = content.map(content, function(elm) {
			elm = jQuery(elm);
			if(elm.type == 'img') {
				return [elm, _subtitle(elm)];
			} else {
				return elm;
			}
		}
		content.each(function() {
			jQuery(this).each(function() { this.after(_subtitle(this)); });
		}
		cb(content);
	};

	this.insert_media = function(entry, body, cb) {
		// TODO: extract enclosure URLs
	};

	this.extract_image_urls = function(content, cb) {
		var top_level_images = content.filter('img');
		content.each(function() {
			top_level_images += this.find('img');
		}
		return jQuery.map(top_level_images, function(img) {
			return jQuery(img).attr(src);
		}
	};

}

