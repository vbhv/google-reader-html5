$(document).ready(function(){
	Logging.setlevel('info');
	var should=test;

	function todo() {
		equals("not yet complete", "done");
	}

	function pending() {
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
			return pending();
			same(parse(entry().with_media_url('media1').with_media_url('media2')).media,
				['media1','media2']);
		});

		test("should extract enclosure elements", function(){
			pending();
		});

		test("should extract singular values", function(){
			pending();
		});

		test("should extract categories", function(){
			pending();
		});

		test("should extract read, starred, shared states", function(){
			pending();
		});

		test("should use 'summary' if body is not present", function(){
			pending();
		});

		test("should extract & construct date", function(){
			pending();
		});

		test("should set a default state", function(){
			same(parse(entry().with_states([]).with_tags([])).state, {
				read:false,
				publish: false,
				starred: false,
				tags: [],
			})
		});

		test("should use the base href to set a base URL", function(){
			pending();
		});

	})();

});



