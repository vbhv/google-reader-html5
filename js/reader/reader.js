
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
			console.log("sidinfo: " + sidinfo);
			_this.sid = null;
			SID_ID = 'SID=';
			if (sidinfo.indexOf(SID_ID) != -1) {
				sid = sidinfo.split(SID_ID)[1]
				if (sid.indexOf('\n') != -1) {
					sid = sid.split('\n')[0]
				}
				_this.sid = sid
				console.log("SID: " + sid);
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


	this.get_feed = function(opts, cb) {
		// returns a GoogleFeed, giving either an 'url' or a 'feed' internal name.
		// other arguments may be any keys of GoogleReaderConst.ATOM_ARGS keys
		var feedurl:
		if ('url' in opts) {
			feedurl = GoogleReaderConst.ATOM_GET_FEED + urllib.quote_plus(url); // grab a url
		} else if ('feed' in opts) {
			feedurl = urllib.quote(utf8(feed)); // grab a feed by name
		} else {
			feedurl = GoogleReaderConst.ATOM_STATE_READING_LIST; // everything
		}
		
		feedurl = GoogleReaderConst.URI_PREFIXE_ATOM + feedurl;
		
		urlargs = {};
		kwargs['client'] = GoogleReaderConst.AGENT;
		kwargs['timestamp'] = self.get_timestamp();
		this._translate_args( GoogleReaderConst.ATOM_ARGS, urlargs, opts );

		var atomfeed = self._web.get(feedurl + '?' + urllib.urlencode(urlargs));

		if (atomfeed != '') {
			// TODO!!!
			return cb(GoogleFeed(atomfeed));
		}

		throw "oh crap";
	};


	// medium-level

	this.get_subscription_list = function() {
		//get_subscription_list' returns a structure containing subscriptions.
		this.get_api_list(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_SUBSCRIPTION, cb);
	}

	this.get_tag_list = function(cb) {
		this.get_api_list(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_TAG, {all:true}, cb);
	};

	this.def get_unread_count_list = function(db) {
		// returns a structure containing the number of unread items in each subscriptions/tags.
		this.get_api_list(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_UNREAD_COUNT, {all:true}, cb);
	};



	// HIGH-level

	this.get_all = function(cb) {
		this.get_feed({}, cb);
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

	this.add_star = function(entry}, cb) {
		this.edit_tag({entry:entry, add:GoogleReaderConst.ATOM_STATE_STARRED}, cb);
	};

	this.del_star = function(entry}, cb) {
		this.edit_tag({entry:entry, remove:GoogleReaderConst.ATOM_STATE_STARRED}, cb);
	};

	this.add_public = function(entry}, cb) {
		this.edit_tag({entry:entry, add:GoogleReaderConst.ATOM_STATE_BROADCAST}, cb);
	};

	this.del_public = function(entry}, cb) {
		this.edit_tag({entry:entry, remove:GoogleReaderConst.ATOM_STATE_BROADCAST}, cb);
	};

	this.add_label = function(entry,labelname}, cb) {
		this.edit_tag({entry:entry, add:GoogleReaderConst.ATOM_PREFIXE_LABEL+labelname}, cb);
	};

	this.del_label = function(entry,labelname}, cb) {
		this.edit_tag({entry:entry, remove:GoogleReaderConst.ATOM_PREFIXE_LABEL+labelname}, cb);
	};

}
