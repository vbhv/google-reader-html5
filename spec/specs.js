Screw.Unit(function() {
	// Tests are organized into 'describes' and 'its', following the style of RSpec.
	describe("foo", function() {
		it("returns 2", function() {
			// 'equal' is one among many matchers provided with the Screw.Unit distribution. It
			// is smart enough to compare arrays, objects, and primitives.
			expect(1 + 3).to(equal, 4);
		});
	});
});

