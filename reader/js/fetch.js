function GET(url, data, cb, err) {
	_ajax('GET', url, data, cb, err);
}

function POST(url, data, cb, err) {
	_ajax('POST', url, data, cb, err);
}
_USE_PROXY_ = true;
_USE_FAKE_ = false;
function _ajax(method, url, data, cb, err) {
	data = data || {};
	if ('Passwd' in data && (data.Passwd == '' || data.Passwd == 'FAKE')) {
		// if we're logging in with dummy details..
		_USE_FAKE_ = true;
		// console.log("using fake connection");
	}
	if (_USE_PROXY_ && (url != "/auth")) { // hard code to *not* proxy auth requests
		data['url'] = url;
		data['method'] = method;
		url = '/proxy';
		method = 'POST';
		if (_USE_FAKE_) {
			data['FAKE'] = 1;
		}
	}
	// console.log("DATA: " + JSON.stringify(data));
	jQuery.ajax({
		type: method,
		url: url,
		data: data,
		error: err || function() { alert("things went sour while fetching url: " + url + " with data:\n"); },
		success: cb,
	})
}

