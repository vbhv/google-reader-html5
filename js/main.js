var app;
Logging.setlevel('debug');

main = function() {
	GoogleReader = GoogleReader.BakeConstructor();
	var reader = new GoogleReader();
	var processor = new Processor();
	var store = new Store('dom');
	// store = new Store();
	var sync = new Sync(reader, store, processor);
	var ui = new UI(store);
	app = new App(reader, store, sync, ui, processor);
	app.main(NULL_CB);
}.bake();

$(function() {main();});

assign = function(x) {
	result = x;
	info("result = " + JSON.stringify(result));
}

