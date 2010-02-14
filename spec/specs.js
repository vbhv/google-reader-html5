Screw.Unit(function() {

	function todo() {
		expect("not yet complete").to(equal, "done");
	};

	describe("processor", function() {
		var mock_store;
		var processor;
		var added_urls;

		before(function(){
			added_urls = [];
			mock_store = {
				add_image: function(url, cb) {
					added_urls.push(url);
					cb();
				}.bake(),
			};
			processor = new Processor(mock_store);
		});

		var process = function(entry) {
			if(!('media' in entry)) {
				entry.media = [];
			}
			return processor.run(entry);
		};

		it("should extract image URLs", function() {
			expect(process({
				body: '<p>Some nested image: <img src="http://example.com/image1" alt="blah" /></p> and a top level: <img src="http://example.com/queryImage?x=y"> as well.',
			}).images).to(equal, ['http://example.com/image1', 'http://example.com/queryImage']);
		});

		it("should insert ALT text beneath inline images", function() {
			expect(process({
				body: '<p><img src="#foo" alt="blah"></p>',
			}).body).to(equal,  '<p><img src="#foo" alt="blah"><div><em>blah</em><p> </p></div></p>');

			expect(process({
				body: 'and a top level: <img src="#foo" alt="x"> as well.',
			}).body).to(equal,  'and a top level: <img src="#foo" alt="x"><div><em>x</em><p> </p></div> as well.');

			var content = 'no alt text: <img src="foo">';
			expect(process({
				body: content,
			}).body).to(equal, content);
		});

		it("should insert enclosure-based images", function(){
			expect(process({
				body: '<p>text!</p>',
				media: ['image1.JPEG', 'image2.jpg?q=x', 'audio.mp3'],
			}).body).to(equal,  '<p>text!</p><ul class="enclosure"><li><img src="image1.JPEG"></li><li><img src="image2.jpg"></li></ul>');
		});

	});



	describe("entry construction", function(){

		it("should extract media elements", function(){
			todo();
		});

		it("should extract enclosure elements", function(){
			todo();
		});

		it("should singular values", function(){
			todo();
		});

		it("should extract categories", function(){
			todo();
		});

		it("should use 'summary' if body is not present", function(){
			todo();
		});

		it("should extract & construct date", function(){
			todo();
		});

		it("should set a default state", function(){
			todo();
		});

	});
});

