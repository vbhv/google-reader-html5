var reader;
var ui;
var sync;
var store;
var LOGIN_DETAILS = {};
var LOGGED_IN = false;

function ensure_login(cb){
	if(LOGGED_IN) { cb(); }
	yield reader.login.result(
		LOGIN_DETAILS.user || prompt('User'),
		LOGIN_DETAILS.password || prompt("Password"));
	LOGGED_IN = true;
	cb();
};

function do_sync(do_download, cb) {
	yield ensure_login.result();
	console.log("log")
	if(do_download) {
		console.log("run!")
		yield sync.run.result();
	} else {
		console.log("push!")
		yield sync.push.result();
	}
	console.log("now for a refresh")
	yield ui.refresh.result();
	cb();
}

function add_an_underscore(item, cb) {
	cb(item + "_");
}

function main2() {
	var arr = ['a','b','c'];
	var mapped = yield map_cb.result(arr, function(item, cb) {
		cb(yield add_an_underscore.result(item));
	});
	alert(mapped);
}

function main() {

	reader = new GoogleReader();
	store = new Store('dom');
	// store = new Store();
	sync = new Sync(reader, store);
	ui = new UI(store);
	if (yield store.isEmpty.result()) {
		console.log("starting a sync");
		yield do_sync.result(true);
	} else {
		console.log("no sync needed");
		var success = false;
		ui.refresh(function() { success = true; });
		window.setTimeout(function() {
			if(!success) {
				console.log("UI did not load after 5 seconds - forcing a fresh sync");
				store.clear();
				do_sync(true);
			}
		}, 5 * 1000);
	}
};

$(function() { async(main)()});
