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
	self.GET.doAsync = false;

	self.POST = function(url, data, cb, err) {
		data['SID'] = self.sid;
		POST(url, data, cb, err);
	};
	self.POST.doAsync = false;

	self.getToken = function(force, cb) {
		if(force || !self.token) {
			var feedurl = GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_TOKEN;
			self.GET(feedurl, {client: GoogleReaderConst.AGENT}, cb);
		} else {
			cb(self.token);
		}
	};
	self.getToken.doAsync = false;

	// low-level:

	self.getApiList = function(url, data, cb) {
		data['output'] = GoogleReaderConst.OUTPUT_JSON;
		data['client'] = GoogleReaderConst.AGENT;
		self.GET(url, data, function(obj){ cb(JSON.parse(obj)); });
	};
	self.getApiList.doAsync = false;

	self.getTimestamp = function() {
		return new Date().getTime();
	};
	self.getTimestamp.doAsync = false;


	self._translateArgs = function(dictionary, googleargs, kwargs) {
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
	self._translateArgs.doAsync = false;

	self.getFeed = function(opts, cb) {
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
		opts['timestamp'] = self.getTimestamp();
		self._translateArgs( GoogleReaderConst.ATOM_ARGS, urlargs, opts );

		function innerCb(data) {
			cb(new Feed(data));
		}
		self.GET(feedurl, urlargs, innerCb);
	};
	self.getFeed.doAsync = false;

	self.editApi = function(editOperation, argMapping, opts, cb) {
		warn("reader: not bothering to editApi: " + editOperation);
		return cb(true);
		var urlargs = {};
		urlargs['client'] = GoogleReaderConst.AGENT;

		var postargs = {};
		self.getToken(false, function(token) {
			opts['token'] = token;
			self._translateArgs( argMapping, postargs, opts );

			var feedurl = GoogleReaderConst.URI_PREFIXE_API + editOperation;
			self.POST(feedurl, postargs, function(resultEdit) {
				if(jQuery.trim(resultEdit) != "OK") {
					//force try once more
					self.getToken(true, function(token) {
						self._translateArgs( argMapping, postargs, opts )
						self.POST(feedurl, postargs, function(resultEdit) {
							if(jQuery.trim(resultEdit) != 'OK') {
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
	self.editApi.doAsync = false;

	// medium-level

	self.getSubscriptionList = function(cb) {
		//getSubscriptionList' returns a structure containing subscriptions.
		self.getApiList(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_SUBSCRIPTION, cb);
	}

	self.getTagList = function(cb) {
		self.getApiList(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_TAG, {all:true}, cb);
	};


	self.getUnreadCountList = function(cb) {
		// returns a structure containing the number of unread items in each subscriptions/tags.
		self.getApiList(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_UNREAD_COUNT, {all:true}, cb);
	};

	self.editTag = function(opts, cb) {
		opts = opts || {}
		if(!('feed' in opts)) {
			opts['feed'] = GoogleReaderConst.ATOM_STATE_READING_LIST;
		}
		opts['action'] = 'edit-tags';
		self.editApi(GoogleReaderConst.API_EDIT_TAG, GoogleReaderConst.EDIT_TAG_ARGS, opts, cb);
	};


	// HIGH-level

	self.getAll = function(cb) {
		self.getFeed({}, cb);
	};

	self.getTagFeed = function(tag, opts, cb) {
		if (opts == null) {
			opts = {}
		}
		if (!('count' in opts)) {
			count = GoogleReaderConst.ITEMS_PER_REQUEST;
		}
		if( !('excludeTarget' in opts) )
			opts['excludeTarget'] = GoogleReaderConst.ATOM_STATE_READ;

		opts['feed'] = GoogleReaderConst.ATOM_PREFIXE_LABEL + tag;

		return self.getFeed(opts, cb)
	};

	self.getUserTags = function(cb) {
		self.getTagList(function(tagList) {
			var tags = tagList.tags;
			var tagNames = Array();
			for(var i=0; i<tags.length; i++) {
				var tag = tags[i];
				// var count = unreadHash[tag.id];
				parts = tag.id.split('/',4);
				var name = parts[3];
				if (parts[2] == 'label') {
					tagNames.push(name);
				} else {
					verbose("ignoring feed: " + tag.id);
				}
			}
			cb(tagNames);
		});
	};

	self.getUnread = function(cb) {
		self.getFeed({excludeTarget:GoogleReaderConst.ATOM_STATE_READ}, cb);
	};


	self.setFlag = function(entry, flag, addOrRemove, cb) {
		var args = {entry:entry};
		var key = addOrRemove ? 'add' : 'remove';
		args[key] = flag;
		self.editTag(args, cb);
	};

	self.setRead = function(entry, val, cb) {
		self.setFlag(entry, GoogleReaderConst.ATOM_STATE_READ, val, cb);
	};

	self.setStar = function(entry, val, cb) {
		self.setFlag(entry, GoogleReaderConst.ATOM_STATE_STARRED, val, cb);
	};

	self.setPublic = function(entry, val, cb) {
		self.setFlag(entry, GoogleReaderConst.ATOM_STATE_BROADCAST, val, cb);
	};

	self.addLabel = function(entry, labelname, cb) {
		self.editTag({entry:entry, add:GoogleReaderConst.ATOM_PREFIXE_LABEL+labelname}, cb);
	};

	self.delLabel = function(entry,labelname, cb) {
		self.editTag({entry:entry, remove:GoogleReaderConst.ATOM_PREFIXE_LABEL+labelname}, cb);
	};

}

function Feed(xmlDocument) {
	this.doc = jQuery(xmlDocument);
	this.properties = {};
	this.continuation = null;
	this.entries = Array();
	var self = this;
	this.doc.find("feed > entry").each(function() {
		var entry = new Entry(this);
		self.entries.push(entry);
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
	this.body = this.body.replace(/<script.*?<\/script>/, '');
	this.title = this.doc.children('title').eq(0).text();
	this.link = this.doc.children('link').eq(0).attr('href');

	// should be: (if not for jQuery parsing oddities)
	// this.feedName = this.doc.children('source').find('title').eq(0).text();
	var titles = this.doc.children('title');
	this.feedName = titles.eq(titles.length - 1).text();


	this.timestamp = Entry.parseDate(this.doc.children('published').eq(0).text()).getTime();

	var attrs = function(collection, name) {
		return jQuery.map(collection, function(elem) {
			return jQuery(elem).attr(name);
		});
	}

	this.media =
		attrs(this.doc.find('media\\:content'), 'url').concat(
		attrs(this.doc.children('link[rel=enclosure]'), 'href')
	);

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
			var termParts = term.split('/');
			var type = termParts[0];
			var name = termParts.slice(1).join("/");
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
				info("unknown category type: " + type);
			}
		}
	});
	delete this.doc; //this causes circular reference errors (somehow)
	this.toString = function() {
		return "ENTRY: " + this.id;
	};
}

Entry.isUnread = function(entry) {
	return !(entry.state.read);
}

Entry.parseDate = function(str) {
	if(!str) { return null; }
	str = str.slice(0,-1);
	var dayTime = str.split('T');
	var day = dayTime[0], time = dayTime[1];

	var hms = time.split(':');
	var h=hms[0], m=hms[1], s=hms[2];

	var yearMonthDay = day.split('-');
	var year=yearMonthDay[0], month=yearMonthDay[1], day=yearMonthDay[2];

	var date = new Date(Date.UTC(parseInt(year), parseInt(month)-1, parseInt(day), parseInt(h), parseInt(m), parseInt(s)));
	return date;
}

