var reader;
var ui;
var sync;
var store;
var LOGIN_DETAILS = {};

function login(cb){
	reader.login(LOGIN_DETAILS.user || prompt('User'), LOGIN_DETAILS.password || prompt("Password"), cb);
};

function init_tags() {
	reader.get_user_tags(function(tag_list) {
		jQuery.each(tag_list, function(i) {
			ui.Tag(tag_list[i], 0);
		});
	});
};

function main() {
	reader = new GoogleReader();
	store = new Store('dom');
	sync = new Sync(reader, store);
	ui = new UI(store);
	login(function() {
		sync.run(function() {ui.refresh();});
	});
};

$(main);
