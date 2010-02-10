var app;
Logging.setlevel('debug');

Person = function(name) {
	this.name=name;

	this.get_input = function(_prompt, cb) {
		// some arbitrary async function
		window.setTimeout(function() {
			var surname = prompt(_prompt);
			console.log("returning " + surname + " into function " + cb)
			cb(surname)
		}, 100);
	}
	
}.Baked();
// you Bake() a constructor, which will ensure that each of its instance methods are baked()

// Baked() works on prototype functions, too:
Person.prototype.get_surname = function(cb) {
	// any baked function will yield a function call descriptor
	// if you supply exactly one less argument than it expects
	this.surname = yield this.get_input("what's your surname?");
	cb();
}

Person.prototype.get_age = function(cb) {
	// "vanilla" callbacks are still used, if provided
	this.get_input("what's your age?", function(age) {
		this.age = age;
		cb();
	});
}

function thatFunctionThatUsesCallbacks(callback) {
		window.setTimeout(function() {
			callback("callback result!")
		}, 1000);
}

var main2 = function(_cb){
	info("main2()")
	var person = new Person("tim");
	yield person.get_surname();
	yield person.get_age();
	console.log("person.surname = " + person.surname);

	// you can easily yield a FDC for thatFunctionThatUsesCallbacks,
	// provided you bake() it *exactly once*
	thatFunctionThatUsesCallbacks = thatFunctionThatUsesCallbacks.baked();
	alert(yield thatFunctionThatUsesCallbacks());
}.baked();

main = function() {
	var reader = new GoogleReader();
	var store = new Store('dom');
	// store = new Store();
	var sync = new Sync(reader, store);
	var ui = new UI(store);
	app = new App(reader, store, sync, ui);
	app.main(NULL_CB);
}.baked();

$(function() {main2(NULL_CB); });

assign = function(x) {
	result = x;
	console.log("result = " + JSON.stringify(result));
}

