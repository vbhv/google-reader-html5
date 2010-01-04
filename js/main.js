var reader;
var ui;
var sync;
var store;
var LOGIN_DETAILS = {};
var LOGGED_IN = false;

function ensure_login(cb){
	if(LOGGED_IN) { return cb(); }
	reader.login(LOGIN_DETAILS.user || prompt('User'), LOGIN_DETAILS.password || prompt("Password"),
		function() { LOGGED_IN = true; cb() });
};

function do_sync(no_download) {
	ensure_login(function() {
		var cb = function() { ui.refresh(); };
		if(no_download) {
			sync.push(cb);
		} else {
			sync.run(cb);
		}
	});
}

function main() {
	reader = new GoogleReader();
	store = new Store('dom');
	// store = new Store();
	sync = new Sync(reader, store);
	ui = new UI(store);
	store.ifEmpty(do_sync, function() {
		var success = false;
		ui.refresh(function() { success = true; });
		window.setTimeout(function() {
			if(!success) {
				console.log("UI did not load after 5 seconds - forcing a fresh sync");
				store.clear();
				do_sync();
			}
		}, 5 * 1000);
	});
};

$(main);
