function EntryBuilder() {
	this.title = "title";
	this.id = "id";
	this.body="body";
	this.link="http://google.com";
	this.google_id="google_id";
	this.feed_name="feed name";
	this.publish_date="2009-12-29T00:29:41Z";
	this.media_urls=[];
	this.enclosures=[];
	this.tags = ['tag1','tag2'];

	this.__noSuchMethod__ = function(attr, args) {
		var attr_name = attr.replace(/^with_/, '');
		var attr_name_pl = attr + 's';
		var val = args[0];
		if(attr_name in this) {
			this[attr_name] = val;
		} else if(attr_name_pl in this) {
			this[attr_name].push(val);
		} else {
			throw "No such attribute: " + attr_name;
		}
		return this;
	};

	this.build = function() {
		var xml = '<entry gr:crawl-timestamp-msec="1262048383557">' + 
			'	<id gr:original-id="'+this.google_id+'">tag:google.com,2006:reader/item/34a32a3877947efd</id>';
		jQuery.each(this.tags, function() {
			xml += '<category term="user/00000000000000000000/label/'+this+'" scheme="http://www.google.com/reader/" label="[pod85] Links"/>';
		});
		jQuery.each(this.states, function() {
			xml += '<category term="user/00000000000000000000/state/com.google/'+this+'" scheme="http://www.google.com/reader/" label="'+this+'"/>' +
		});
		xml += '<title type="html">'+this.title+'</title>' +
			'	<published>'+this.publish_date+'</published>' +
			'	<updated>'+this.publish_date+'</updated>' +
			'	<link rel="alternate" href="'+this.link+'" type="text/html"/>' +
			'	<summary xml:base="'+this.base_href+'" type="html">'+this.summary+'</summary>';

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
			'		<title type="html">feed title</title>' +
			'		<link rel="alternate" href="'+this.link+'" type="text/html"/>' +
			'	</source>' +
			'</entry>';
		return xml;
	};
};
