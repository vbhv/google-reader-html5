$(document).ready(function(){
	Logging.setlevel('info');
	var should=test;

	function todo() {
		equals("not yet complete", "done");
	}

	function pending() {
		error("Pending test!");
		ok('pending');
	}

	(function() {
		var processor;
		module("processor", {
			setup: function(){
				processor = new Processor({});
			},
		});

		var process = function(entry) {
			if(!('media' in entry)) {
				entry.media = [];
			}
			return processor.run(entry);
		};

		test("should extract image URLs", function() {
			same(process({
				body: '<p>Some nested image: <img src="http://example.com/image1" alt="blah" /></p> and a top level: <img src="http://example.com/queryImage?x=y"> as well.',
			}).images, ['http://example.com/image1', 'http://example.com/queryImage']);
		});

		test("should insert ALT text beneath inline images", function() {
			equals(process({
				body: '<p><img src="#foo" alt="blah"></p>',
			}).body,  '<p><img src="#foo" alt="blah"><div><em>blah</em><p> </p></div></p>');

			equals(process({
				body: 'and a top level: <img src="#foo" alt="x"> as well.',
			}).body,  'and a top level: <img src="#foo" alt="x"><div><em>x</em><p> </p></div> as well.');

			var content = 'no alt text: <img src="foo">';
			equals(process({
				body: content,
			}).body, content);
		});

		test("should insert enclosure-based images", function(){
			equals(process({
				body: '<p>text!</p>',
				media: ['image1.JPEG', 'image2.jpg?q=x', 'audio.mp3'],
			}).body,  '<p>text!</p><ul class="enclosure"><li><img src="image1.JPEG"></li><li><img src="image2.jpg"></li></ul>');
		});

	})();


	(function() {
		module("entry construction");
		function parse(entry) {
			return new Entry(entry.build());
		}
		function entry() {
			return new EntryBuilder();
		}

		test("should extract media elements", function(){
			same(parse(entry().with_media_url('media1').with_media_url('media2')).media,
				['media1','media2']);
		});

		test("should extract enclosure elements", function(){
			same(parse(entry().with_media_url('media1').with_enclosure('enclosure1')).media,
				['media1','enclosure1']);

			same(parse(entry().with_enclosure('enclosure1').with_enclosure('enclosure2')).media,
				['enclosure1','enclosure2']);
		});

		test("should extract singular values", function(){
			var parsed = parse(entry().
				with_title('title').
				with_link('http://example.com/post1').
				with_google_id('g1234').
				with_feed_name('the best feed').
				with_content('body').
				with_id('1234'));

			same(parsed.title, 'title');
			same(parsed.link, 'http://example.com/post1');
			same(parsed.google_id, 'g1234');
			same(parsed.id, '1234');
			same(parsed.body, 'body');
			same(parsed.feed_name, 'the best feed');
		});

		test("should extract categories", function(){
			var tags = ['foo','bar'];
			same(parse(entry().with_tags(tags)).state.tags, tags);
		});

		test("should use 'summary' if content is not present", function(){
			same(parse(entry().with_content(null).with_summary('summary')).body, 'summary');
		});

		test("should extract & construct date", function(){
			// note: month is zero-indexed
			var expected_timestamp = Date.UTC(2010, 1, 23, 0, 29, 41);
			var timestamp = parse(entry().with_publish_date("2010-02-23T00:29:41Z")).timestamp;
			same(new Date(timestamp), new Date(expected_timestamp));
		});

		test("should set a default state", function(){
			same(parse(entry().with_states(['reading-list']).with_tags([])).state, {
				read:false,
				publish: false,
				star: false,
				tags: [],
			})
		});

		test("should extract read, starred, shared states", function(){
			same(parse(entry().with_states([])).state.read, true);
			same(parse(entry().with_state('reading-list')).state.read, false);
			same(parse(entry().with_state('starred')).state.star, true);
			same(parse(entry().with_state('broadcast')).state.publish, true);
		});

		test("should use the base href to set a base URL", function(){
			pending();
		});

	})();


	(function() {
		var reader = {};
		var store = {};
		var processor = {};
		var sync = new Sync(reader, store, processor);

		module("image sync");

		asyncTest("should download all missing images", function(){
			var get_requests = [];
			store.missing_images = function(cb) {
				cb(['new1','new2']);
			};
			var old_get = GET;
			GET = function(url, data, cb, err) {
				get_requests.push([url,data]);
			}
			sync.mirror_images(function() {
				GET = old_get;
				same(get_requests, ['new1','new2']);
				start();
			});
		});
	})();

	(function() {
		var store;
		var _lawnchair;
		var lawnchairs;
		module("store", {
			setup: function() {
				_lawnchair = Lawnchair;
				lawnchairs = {};
				Lawnchair = function(opts) {
					var name = opts.table;
					console.info("Lawnchair created: " + name);
					lawnchairs[name] = this;
				}
				store = new Store();
			},

			teardown: function() {
				Lawnchair = _lawnchair;
			},
		});

		asyncTest("store should construct a list of all missing images", function() {
			store._all_used_images = function(cb) {
				cb(['a','b','c']);
			}.bake();
			
			lawnchairs['images'].all = function(cb) {
				cb([{key:'a'},{key:'d'},{key:'e'}]);
			}.bake();

			store.missing_images(function(images) {
				same(images, ['b','c']);
				start();
			});
		});

		asyncTest("store should drop all unnecessary images", function() {
			var removed = [];
			lawnchairs['images'].remove = function(key) {
				removed.push(key);
			};

			store._all_used_images = function(cb) {
				cb(['a','b','c']);
			}.bake();

			lawnchairs['images'].all = function(cb) {
				cb([{key:'a'},{key:'d'},{key:'e'}]);
			}.bake();
				
			store.remove_unused_images(function() {
				same(removed, ['d','e']);
				start();
			});
		});

		asyncTest("store should extract all used images from current items", function() {
			var removed;
			function ItemWithImage(images, read) {
				this.images = images;
				this.state = {read: read};
			};

			var unread_items = [
				new ItemWithImage(['a1','b1'], false),
				new ItemWithImage(['c1'], false),
			];

			var read_items = [
				new ItemWithImage(['a2','b2'], true),
				new ItemWithImage(['c2'], true),
			];

			lawnchairs['items'].all = function(cb) {
				cb(unread_items.concat(read_items));
			}.bake();

			store._all_used_images = function(used) {
				same(used, ['a1','b1','c1']);
				start();
			}.bake();
		});

		asyncTest("store should delete all read items", function() {
			var removed = [];
			function RemoveableItem(id, read) {
				this.key = id;
				this.remove = function() {
					removed.push(id);
				};
				this.state = {read: read};
			};

			var unread_items = [
				new RemoveableItem('unread1', false),
				new RemoveableItem('unread2', false),
				new RemoveableItem('unread2', false),
			];
			var read_items = [
				new RemoveableItem('read1', true),
				new RemoveableItem('read2', true),
				new RemoveableItem('read2', true),
			];

			lawnchairs['items'].all = function(cb) {
				cb(unread_items.concat(read_items));
			}.bake();

			store.delete_read_items(function() {
				same(removed, ['read1','read2','read3']);
				start();
			});
		});

	})();

});



