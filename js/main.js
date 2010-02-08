var app;
Logging.setlevel('debug');

main = function main() {
	var reader = new GoogleReader();
	var store = new Store('dom');
	// store = new Store();
	var sync = new Sync(reader, store);
	var ui = new UI(store);
	app = new App(reader, store, sync, ui);
	app.main(NULL_CB);
}.baked();

$(main);

assign = function(x) {
	result = x;
	console.log("result = " + JSON.stringify(result));
}

