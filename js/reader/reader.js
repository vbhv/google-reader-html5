
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

	this.get_token = function(force, cb) {
		if(force || !this.token) {
			var feedurl = GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_TOKEN;
			this.GET(feedurl, {client: GoogleReaderConst.AGENT}, cb);
		} else {
			cb(this.token);
		}
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

	this.edit_api = function(edit_operation, arg_mapping, opts, cb) {
		var self = this;
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

	this.edit_tag = function(opts, cb) {
		opts = opts || {}
		if(!('feed' in opts)) {
			opts['feed'] = GoogleReaderConst.ATOM_STATE_READING_LIST;
		}
		opts['action'] = 'edit-tags';
		this.edit_api(GoogleReaderConst.API_EDIT_TAG, GoogleReaderConst.EDIT_TAG_ARGS, opts, cb);
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
		var self = this;
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
					console.log("feed: " + tag.id);
				}
			}
			cb(tag_names);
		});
	};

	this.get_unread = function(cb) {
		this.get_feed({exclude_target:GoogleReaderConst.ATOM_STATE_READ}, cb);
	};


	this.set_flag = function(entry, flag, add_or_remove, cb) {
		var args = {entry:entry};
		var key = add_or_remove ? 'add' : 'remove';
		args[key] = flag;
		this.edit_tag(args, cb);
	};

	this.set_read = function(entry, val, cb) {
		this.set_flag(entry, GoogleReaderConst.ATOM_STATE_READ, val, cb);
	};

	this.set_star = function(entry, val, cb) {
		this.set_flag(entry, GoogleReaderConst.ATOM_STATE_STARRED, val, cb);
	};

	this.set_public = function(entry, val, cb) {
		this.set_flag(entry, GoogleReaderConst.ATOM_STATE_BROADCAST, val, cb);
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
}

function Entry(xml) {
	this.doc = jQuery(xml);
	this.id = this.doc.children('id').eq(0).text();
	this.body = this.doc.children('summary').eq(0).text();
	this.title = this.doc.children('title').eq(0).text();
	this.link = this.doc.children('link').eq(0).attr('href');
	this.google_id = this.doc.children('id').eq(0).text();
	this.doc = null; //this causes circular reference errors (somehow)
	this.toString = function() {
		return "ENTRY: " + this.id;
	};
}

