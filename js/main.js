var app;

function main() {
	var reader = new GoogleReader();
	var store = new Store('dom');
	// store = new Store();
	var sync = new Sync(reader, store);
	var ui = new UI(store);
	app = new App(reader, store, sync, ui);
	async(app.main)(function(){});
};

$(main);
