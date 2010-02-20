function EntryBuilder() {
	this.title = "title";
	this.id = "id";
	this.content="content";
	this.summary = 'summary';
	this.link="http://google.com";
	this.google_id="google_id";
	this.feed_name="feed name";
	this.publish_date="2009-12-29T00:29:41Z";
	this.media_urls=[];
	this.enclosures=[];
	this.tags = [];
	this.states = [];

	this.__noSuchMethod__ = function(func_name, args) {
		var attr_name = func_name.replace(/^with_/, '');
		var attr_name_pl = attr_name + 's';
		var val = args[0];
		if(attr_name in this) {
			this[attr_name] = val;
		} else if(attr_name_pl in this) {
			this[attr_name_pl].push(val);
		} else {
			throw "No such attribute: " + attr_name;
		}
		return this;
	};

	this.build = function() {
		var xml = '<entry gr:crawl-timestamp-msec="1262048383557">' + 
			'	<id gr:original-id="'+this.id+'">'+this.google_id+'</id>';
		jQuery.each(this.tags, function() {
			xml += '<category term="user/00000000000000000000/label/'+this+'" scheme="http://www.google.com/reader/" label="[pod85] Links"/>';
		});
		jQuery.each(this.states, function() {
			xml += '<category term="user/00000000000000000000/state/com.google/'+this+'" scheme="http://www.google.com/reader/" label="'+this+'"/>';
		});
		xml += '<title type="html">'+this.title+'</title>' +
			'	<published>'+this.publish_date+'</published>' +
			'	<updated>'+this.publish_date+'</updated>' +
			'	<link rel="alternate" href="'+this.link+'" type="text/html"/>' +
			'	<summary xml:base="'+this.base_href+'" type="html">'+this.summary+'</summary>';

		if(this.media_urls) {
			xml += '<media:group>';
			jQuery.each(this.media_urls, function() {
				xml += '<media:content url="' + this + '"/>';
			});
			xml += '</media:group>';
		}

		if(this.enclosures) {
			jQuery.each(this.enclosures, function() {
				xml += '<link rel="enclosure" href="' + this + '"/>';
			});
		}

		if(this.content) {
			xml += '<content type="html">'+this.content+'</content>';
		}

		xml += '<author gr:unknown-author="true">' +
			'		<name>(author unknown)</name>' +
			'	</author>' +
			'	<gr:likingUser>1234</gr:likingUser>' +
			'	<gr:likingUser>4321</gr:likingUser>' +
			'	<source gr:stream-id="feed/http://example.com/feed/id">' +
			'		<id>tag:google.com,2005:reader/feed/http://example.com/feed/id</id>' +
			'		<title type="html">'+this.feed_name+'</title>' +
			'		<link rel="alternate" href="'+this.link+'" type="text/html"/>' +
			'	</source>' +
			'</entry>';
		return xml;
	};
};
