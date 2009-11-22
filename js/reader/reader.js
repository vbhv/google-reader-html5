
function GoogleReader() {
	this.token = null;

	this.login = function(user, pass) {
		data = {
			service: 'reader',
			Email: user,
			Passwd: pass,
			source: GoogleReaderConst.AGENT,
			'continue': 'http://www.google.com',
		}
		_this = this;
		jQuery.ajax({
			url: GoogleReaderConst.URI_LOGIN,
			data: data,
			error: function() { alert("things went sour :/"); },
			success: function(sidinfo) {
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
				} else {
					console.log("authentication failed");
				}
			},
		});
	};

	this.get_token = function(self, force) {
		if(force || !self.token) {
			feedurl = GoogleReaderConst.URI_PROFIXE_API + 
				GoogleReaderConst.API_TOKEN + '?client=' + GoogleReaderConst.AGENT
			self.token = jQuery.get(feedurl);
		}
		return self.token;
	};


}
