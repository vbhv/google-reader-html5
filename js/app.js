var LOGIN_DETAILS = {};

function App(reader, store, sync, ui) {
	this.reader = reader;
	this.store = store;
	this.ui = ui;
	this.sync = sync
	this.LOGGED_IN = false;
	var self=this;

	self.main = function(cb) {
		if (yield self.store.isEmpty.result()) {
			console.log("starting a sync");
			yield self.do_sync.result(true);
		} else {
			console.log("no sync needed");
			var success = false;
			async(self.ui.refresh)(function() { success = true; cb();});
			window.setTimeout(async(function() {
				if(!success) {
					console.log("UI did not load after 5 seconds - forcing a fresh sync");
					self.store.clear();
					yield self.do_sync.result(true);
					cb();
				}
			}), 5 * 1000);
		}
		cb();
	};

	self.do_sync = function(do_download, cb) {
		yield self.ensure_login.result();
		console.log("log")
		if(do_download) {
			console.log("run!")
			yield self.sync.run.result();
		} else {
			console.log("push!")
			yield self.sync.push.result();
		}
		console.log("now for a refresh")
		yield self.ui.refresh.result();
		cb();
	};

	self.clear_and_sync = function(do_download, cb) {
		self.store.clear();
		yield self.do_sync.result(do_download);
		cb();
	};

	self.ensure_login = function(cb){
		if(self.LOGGED_IN) { cb(); }
		yield self.reader.login.result(
			LOGIN_DETAILS.user || prompt('User'),
			LOGIN_DETAILS.password || prompt("Password"));
		self.LOGGED_IN = true;
		cb();
	};

	self.toggle_show_read = function(cb) {
		self.ui.entry_filter = self.ui.entry_filter ? null : Entry.is_unread;
		yield self.ui.render_tags.result(false);
		yield self.ui.render_feed.result(false);
	};
}

