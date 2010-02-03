
function GoogleReader() {
	var self = this;
	self.token = null;

	self.login = function(user, pass, cb) {
		data = {
			service: 'reader',
			Email: user,
			Passwd: pass,
			source: GoogleReaderConst.AGENT,
			'continue': 'http://www.google.com',
		};

		POST(GoogleReaderConst.URI_LOGIN, data, function(sidinfo) {
			self.sid = null;
			SID_ID = 'SID=';
			if (sidinfo.indexOf(SID_ID) != -1) {
				sid = sidinfo.split(SID_ID)[1]
				if (sid.indexOf('\n') != -1) {
					sid = sid.split('\n')[0]
				}
				self.sid = sid
				cb();
			} else {
				alert("authentication failed");
			}
		});
	};

	self.GET = function(url, data, cb, err) {
		data['SID'] = self.sid;
		GET(url, data, cb, err);
	};

	self.POST = function(url, data, cb, err) {
		data['SID'] = self.sid;
		POST(url, data, cb, err);
	};

	self.get_token = function(force, cb) {
		if(force || !self.token) {
			var feedurl = GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_TOKEN;
			self.GET(feedurl, {client: GoogleReaderConst.AGENT}, cb);
		} else {
			cb(self.token);
		}
	};

	// low-level:

	self.get_api_list = function(url, data, cb) {
		data['output'] = GoogleReaderConst.OUTPUT_JSON;
		data['client'] = GoogleReaderConst.AGENT;
		self.GET(url, data, function(obj){ cb(JSON.parse(obj)); });
	};

	self.get_timestamp = function() {
		return new Date().getTime();
	};


	self._translate_args = function(dictionary, googleargs, kwargs) {
		// `dictionary` maps nicely named args (as keys) to
		// google's API keys (as values). This takes in some
		// kwartgs, and populates (mutates) googleargs
		// appropriately.

		for (arg in dictionary) {
			if (arg in kwargs) {
				googleargs[dictionary[arg]] = kwargs[arg];
			}
			if (dictionary[arg] in kwargs) {
				googleargs[dictionary[arg]] = kwargs[dictionary[arg]];
			}
		}
	};

	self.get_feed = function(opts, cb) {
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
		opts['timestamp'] = self.get_timestamp();
		self._translate_args( GoogleReaderConst.ATOM_ARGS, urlargs, opts );

		function inner_cb(data) {
			cb(new Feed(data));
		}
		self.GET(feedurl, urlargs, inner_cb);
	};

	self.edit_api = function(edit_operation, arg_mapping, opts, cb) {
		var urlargs = {};
		urlargs['client'] = GoogleReaderConst.AGENT;

		var postargs = {};
		self.get_token(false, function(token) {
			opts['token'] = token;
			self._translate_args( arg_mapping, postargs, opts );

			var feedurl = GoogleReaderConst.URI_PREFIXE_API + edit_operation;
			self.POST(feedurl, postargs, function(result_edit) {
				if(jQuery.trim(result_edit) != "OK") {
					//force try once more
					self.get_token(true, function(token) {
						self._translate_args( arg_mapping, postargs, opts )
						self.POST(feedurl, postargs, function(result_edit) {
							if(jQuery.trim(result_edit) != 'OK') {
								alert("edit operation failed!");
								cb(false);
							} else {
								cb(true);
							}
						}, function() { cb(false); });
					});
				} else {
					cb(true);
				}
			});
		});
	};

	// medium-level

	self.get_subscription_list = function() {
		//get_subscription_list' returns a structure containing subscriptions.
		self.get_api_list(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_SUBSCRIPTION, cb);
	}

	self.get_tag_list = function(cb) {
		self.get_api_list(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_TAG, {all:true}, cb);
	};


	self.get_unread_count_list = function(cb) {
		// returns a structure containing the number of unread items in each subscriptions/tags.
		self.get_api_list(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_UNREAD_COUNT, {all:true}, cb);
	};

	self.edit_tag = function(opts, cb) {
		opts = opts || {}
		if(!('feed' in opts)) {
			opts['feed'] = GoogleReaderConst.ATOM_STATE_READING_LIST;
		}
		opts['action'] = 'edit-tags';
		self.edit_api(GoogleReaderConst.API_EDIT_TAG, GoogleReaderConst.EDIT_TAG_ARGS, opts, cb);
	};


	// HIGH-level

	self.get_all = function(cb) {
		self.get_feed({}, cb);
	};

	self.get_tag_feed = function(tag, opts, cb) {
		if (opts == null) {
			opts = {}
		}
		if (!('count' in opts)) {
			count = GoogleReaderConst.ITEMS_PER_REQUEST;
		}
		if( !('exclude_target' in opts) )
			opts['exclude_target'] = GoogleReaderConst.ATOM_STATE_READ;

		opts['feed'] = GoogleReaderConst.ATOM_PREFIXE_LABEL + tag;

		return self.get_feed(opts, cb)
	};

	self.get_user_tags = function(cb) {
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
				} else {
					console.log("ignoring feed: " + tag.id);
				}
			}
			cb(tag_names);
		});
	};

	self.get_unread = function(cb) {
		self.get_feed({exclude_target:GoogleReaderConst.ATOM_STATE_READ}, cb);
	};


	self.set_flag = function(entry, flag, add_or_remove, cb) {
		var args = {entry:entry};
		var key = add_or_remove ? 'add' : 'remove';
		args[key] = flag;
		self.edit_tag(args, cb);
	};

	self.set_read = function(entry, val, cb) {
		self.set_flag(entry, GoogleReaderConst.ATOM_STATE_READ, val, cb);
	};

	self.set_star = function(entry, val, cb) {
		self.set_flag(entry, GoogleReaderConst.ATOM_STATE_STARRED, val, cb);
	};

	self.set_public = function(entry, val, cb) {
		self.set_flag(entry, GoogleReaderConst.ATOM_STATE_BROADCAST, val, cb);
	};

	self.add_label = function(entry, labelname, cb) {
		self.edit_tag({entry:entry, add:GoogleReaderConst.ATOM_PREFIXE_LABEL+labelname}, cb);
	};

	self.del_label = function(entry,labelname, cb) {
		self.edit_tag({entry:entry, remove:GoogleReaderConst.ATOM_PREFIXE_LABEL+labelname}, cb);
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
}

function Entry(xml) {
	var self = this;
	this.doc = jQuery(xml);
	this.id = this.doc.children('id').eq(0).text();
	this.body = this.doc.children('content').eq(0).text();
	if(!this.body) {
		this.body = this.doc.children('summary').eq(0).text();
	}
	this.title = this.doc.children('title').eq(0).text();
	this.link = this.doc.children('link').eq(0).attr('href');
	this.google_id = this.doc.children('id').eq(0).text();
	this.feed_name = this.doc.children('title').eq(0).text();
	this.state = {
		read: true,
		star: false,
		publish: false,
		tags: [],
	};
	this.doc.children('category').each(function() {
		var cat = jQuery(this);
		var scheme = cat.attr("scheme");
		if(scheme == GoogleReaderConst.GOOGLE_SCHEME) {
			var term = cat.attr('term');
			term = term.replace(/user\/[0-9]+\//, '');
			term = term.replace(/state\/com\.google\//, 'state/');
			var term_parts = term.split('/');
			var type = term_parts[0];
			var name = term_parts.slice(1).join("/");
			if(type == 'label') {
				self.state.tags.push(name);
			} else if (type == 'state') {
				if(name == 'reading-list') {
					self.state.read = false;
				} else if (name == 'starred') {
					self.state.star = true;
				} else if (name == 'broadcast') {
					self.state.publish = true;
				}
			} else {
				console.log("unknown category type: " + type);
			}
		}
	});
	this.doc = null; //this causes circular reference errors (somehow)
	this.toString = function() {
		return "ENTRY: " + this.id;
	};
}

