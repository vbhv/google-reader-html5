
function GoogleReader() {
	this.token = null;

	this.login = function(user, pass, cb) {
		data = {
			service: 'reader',
			Email: user,
			Passwd: pass,
			source: GoogleReaderConst.AGENT,
			'continue': 'http://www.google.com',
		}
		_this = this;
		POST(GoogleReaderConst.URI_LOGIN, data, function(sidinfo) {
			_this.sid = null;
			SID_ID = 'SID=';
			if (sidinfo.indexOf(SID_ID) != -1) {
				sid = sidinfo.split(SID_ID)[1]
				if (sid.indexOf('\n') != -1) {
					sid = sid.split('\n')[0]
				}
				_this.sid = sid
				cb();
			} else {
				console.log("authentication failed");
			}
		});
	};

	this.GET = function(url, data, cb, err) {
		data['SID'] = this.sid;
		GET(url, data, cb, err);
	};

	this.POST = function(url, data, cb, err) {
		data['SID'] = this.sid;
		POST(url, data, cb, err);
	};

	this.get_token = function(self, force) {
		if(force || !self.token) {
			feedurl = GoogleReaderConst.URI_PROFIXE_API +
				GoogleReaderConst.API_TOKEN + '?client=' + GoogleReaderConst.AGENT
			self.token = this.GET(feedurl);
		}
		return self.token;
	};

	// low-level:

	this.get_api_list = function(url, data, cb) {
		data['output'] = GoogleReaderConst.OUTPUT_JSON;
		data['client'] = GoogleReaderConst.AGENT;
		this.GET(url, data, function(obj){ cb(JSON.parse(obj)); });
	};

	this.get_timestamp = function() {
		return new Date().getTime();
	};


	this._translate_args = function(dictionary, googleargs, kwargs) {
		for (arg in dictionary) {
			if (arg in kwargs) {
				googleargs[dictionary[arg]] = kwargs[arg];
			}
			if (dictionary[arg] in kwargs) {
				googleargs[dictionary[arg]] = kwargs[dictionary[arg]];
			}
		}
	};

	this.get_feed = function(opts, cb) {
		// returns a GoogleFeed, giving either an 'url' or a 'feed' internal name.
		// other arguments may be any keys of GoogleReaderConst.ATOM_ARGS keys
		var feedurl;
		if (opts == null) opts = {};
		if ('url' in opts) {
			feedurl = GoogleReaderConst.ATOM_GET_FEED + urllib.quote_plus(url); // grab a url
		} else if (('feed' in opts) && opts.feed) {
			feedurl = escape(opts.feed); // grab a feed by name
		} else {
			feedurl = GoogleReaderConst.ATOM_STATE_READING_LIST; // everything
		}
		
		feedurl = GoogleReaderConst.URI_PREFIXE_ATOM + feedurl;
		
		urlargs = {};
		opts['client'] = GoogleReaderConst.AGENT;
		opts['timestamp'] = this.get_timestamp();
		this._translate_args( GoogleReaderConst.ATOM_ARGS, urlargs, opts );

		function inner_cb(data) {
			cb(new Feed(data));
		}
		this.GET(feedurl, urlargs, inner_cb);
	};


	// medium-level

	this.get_subscription_list = function() {
		//get_subscription_list' returns a structure containing subscriptions.
		this.get_api_list(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_SUBSCRIPTION, cb);
	}

	this.get_tag_list = function(cb) {
		this.get_api_list(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_TAG, {all:true}, cb);
	};


	this.get_unread_count_list = function(cb) {
		// returns a structure containing the number of unread items in each subscriptions/tags.
		this.get_api_list(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_UNREAD_COUNT, {all:true}, cb);
	};


	// HIGH-level

	this.get_all = function(cb) {
		this.get_feed({}, cb);
	};

	this.get_tag_feed = function(tag, cb, opts) {
		if (opts == null) {
			opts = {}
		}
		if (!('count' in opts)) {
			count = GoogleReaderConst.ITEMS_PER_REQUEST;
		}
		if( !('exclude_target' in opts) )
			opts['exclude_target'] = GoogleReaderConst.ATOM_STATE_READ;

		opts['feed'] = GoogleReaderConst.ATOM_PREFIXE_LABEL + tag;

		return this.get_feed(opts, cb)
	};

	this.get_user_tags = function(cb) {
		// returns an array of [tag_name, count] pairs
		var self = this;
		// var unread_hash = [];
		// this.get_unread_count_list(function(result) {
		// 	var unreadcounts = result.unreadcounts;
		// 	jQuery.each(unreadcounts, function(i) {
		// 		var count_obj = unreadcounts[i];
		// 		console.log("count_obj: " + count_obj);
		// 		if ('count' in count_obj && 'id' in count_obj) {
		// 			console.log("feed " + count_obj.id + " has " + count_obj.count + " unread items");
		// 			unread_hash[count_obj.id] = count_obj.count;
		// 		} else {
		// 			console.log("incomplete count object: " + count_obj);
		// 		}
		// 	});

			self.get_tag_list(function(tag_list) {
				var tags = tag_list.tags;
				var tag_names = Array();
				for(var i=0; i<tags.length; i++) {
					var tag = tags[i];
					// var count = unread_hash[tag.id];
					parts = tag.id.split('/',4);
					var name = parts[3];
					if (parts[2] == 'label') {
						tag_names.push(name);
						console.log("TAG: " + name);
					} else {
						console.log("feed: " + tag.id);
					}
				}
				cb(tag_names);
			});
		// });
	};

	this.get_unread = function(cb) {
		this.get_feed({exclude_target:GoogleReaderConst.ATOM_STATE_READ}, cb);
	};

	this.set_read = function(entry, cb) {
		this.edit_tag({entry:entry, add:GoogleReaderConst.ATOM_STATE_READ, remove:GoogleReaderConst.ATOM_STATE_UNREAD}, cb);
	};

	this.set_unread = function(entry, cb) {
		this.edit_tag({entry:entry, add:GoogleReaderConst.ATOM_STATE_UNREAD, remove:GoogleReaderConst.ATOM_STATE_READ}, cb);
	};

	this.add_star = function(entry, cb) {
		this.edit_tag({entry:entry, add:GoogleReaderConst.ATOM_STATE_STARRED}, cb);
	};

	this.del_star = function(entry, cb) {
		this.edit_tag({entry:entry, remove:GoogleReaderConst.ATOM_STATE_STARRED}, cb);
	};

	this.add_public = function(entry, cb) {
		this.edit_tag({entry:entry, add:GoogleReaderConst.ATOM_STATE_BROADCAST}, cb);
	};

	this.del_public = function(entry, cb) {
		this.edit_tag({entry:entry, remove:GoogleReaderConst.ATOM_STATE_BROADCAST}, cb);
	};

	this.add_label = function(entry, labelname, cb) {
		this.edit_tag({entry:entry, add:GoogleReaderConst.ATOM_PREFIXE_LABEL+labelname}, cb);
	};

	this.del_label = function(entry,labelname, cb) {
		this.edit_tag({entry:entry, remove:GoogleReaderConst.ATOM_PREFIXE_LABEL+labelname}, cb);
	};

}

function Feed(xmlDocument) {
	this.doc = jQuery(xmlDocument);
	this.properties = {};
	this.continuation = null;
	this.entries = Array();
	var self = this;
	this.doc.find("feed > entry").each(function() {
		self.entries.push(new Entry(this));
	});

	this.render = function() {
		var result = new Array();
		jQuery.each(this.entries, function(e) {
			result.push(this.render());
		});
		return mkNode({type:'div', children: result});
	};
}

function Entry(xml) {
	this.doc = jQuery(xml);
	this.body = this.doc.children('summary').eq(0).text();
	this.title = this.doc.children('title').eq(0).text();
	this.link = this.doc.children('link').eq(0).attr('href');
	this.google_id = this.doc.children('id').eq(0).text();

	this.render = function() {
		var body = mkNode({type:'div'});
		body.innerHTML = this.body;

		var header = mkNode({
			type:'h3',
			children: [
				{type:'a', href: this.link, text: this.title},
			],
		});

		var footer = this.toolbar();

		var root = mkNode({
			type: 'div',
			children: [header, body, footer],
		});
		
		return root;
	};

	this.toolbar = function() {
		return mkNode({
			type:'div',
			class: 'toolbar',
			children: [
				{type:'a', href: '#hello', text: "clicky!"},
			],
		});
	};

}

