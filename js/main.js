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

function init_tags() {
	reader.get_user_tags(function(tag_list) {
		jQuery.each(tag_list, function(i) {
			ui.Tag(tag_list[i], 0);
		});
	});
};

function do_sync() {
	ensure_login(function() {
		sync.run(function() {
			ui.refresh();
		});
	});
}

function main() {
	reader = new GoogleReader();
	store = new Store('dom');
	sync = new Sync(reader, store);
	ui = new UI(store);
	store.ifEmpty(do_sync, function() {ui.refresh();});
};

$(main);
