
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

	this.get_api_list = function(url, data, cb) {
		data['output'] = GoogleReaderConst.OUTPUT_JSON;
		data['client'] = GoogleReaderConst.AGENT;
		this.GET(url, data, function(obj){ cb(JSON.parse(obj)); });
	};

	this.get_tag_list = function(cb) {
		return this.get_api_list(GoogleReaderConst.URI_PREFIXE_API + GoogleReaderConst.API_LIST_TAG, {all:true}, cb);
	};


}
