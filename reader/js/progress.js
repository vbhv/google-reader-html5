var bars=[];
ProgressBar = function(max, description, scope) {
	var self=this;
	bars.push(this);
	scope = jQuery(scope || "#progress");
	scope.append(mkNode(
		{type: 'div', class: 'progress container', children: [
			{type: 'div', class: 'progress message'},
			{type: 'div', class: 'progress bar'}]
		}));

	var root = jQuery('.container', scope);
	root = root.eq(root.length - 1);

	var bar = root.children('.bar');
	var msg = root.children('.message');
	var current = 0;
	var complete = false;
	var shown = false;

	self.prog = function() { bar.progressBar.apply(bar, arguments); };
	var opts ={
		max: max,
		textFormat: 'fraction',
	};
	self.prog(opts);

	self.show = function() {
		root.hide().slideToggle('fast', function(){shown = true;});
		return self;
	};

	self.message = function(newmsg) {
		msg.text(newmsg);
	};

	self.hide = function() {
		root.hide();
		return self;
	};

	self.set = function(val) {
		current = val;
		self.prog(val, opts);
		return self;
	};

	self.remove = function() {
		complete = true;
		if(shown) {
			root.slideToggle('fast', function() { root.remove(); });
		} else {
			root.remove();
		}
		shown = false;
	};

	self.add = function(difference) {
		current += difference;
		self.set(current);
		return self;
	};

	if(description) {
		self.message(description);
	}

	self.hide();
	window.setTimeout(function() {
		if(!complete) {
			self.show();
		}
	}, 100);

};
jQuery.progressBar.defaults.boxImage = "res/jquery.progressbar/progressbar.gif";
jQuery.progressBar.defaults.barImage = "res/jquery.progressbar/progressbg_black.gif";

