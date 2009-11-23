function GET(url, data, cb, err) {
	_ajax('GET', url, data, cb, err);
}

function POST(url, data, cb, err) {
	_ajax('POST', url, data, cb, err);
}
_USE_FAKE_ = true;
function _ajax(method, url, data, cb, err) {
	if (_USE_FAKE_) {
		data['url'] = url;
		data['method'] = method;
		url = 'proxy.py';
		method = 'POST';
	}
	console.log("DATA: " + JSON.stringify(data));
	jQuery.ajax({
		type: method,
		url: url,
		data: data,
		error: err || function() { alert("things went sour :/"); },
		success: cb,
	})
}

