var LOGIN_DETAILS = {};
var TAG_FILTER=[];

App = function(reader, store, sync, ui, processor) {
	this.reader = reader;
	this.store = store;
	this.ui = ui;
	this.sync = sync
	this.processor = processor;
	this.LOGGED_IN = false;
	var self=this;

	self.main = function(cb) {
		yield migrate(self.store);
		if (yield self.store.isEmpty()) {
			info("starting a sync");
			yield self.do_sync(true);
		} else {
			verbose("no sync needed");
			var success = false;
			self.ui.refresh(function() { success = true; cb();});
			window.setTimeout(async(function() {
				if(!success) {
					warn("UI did not load after 5 seconds - forcing a fresh sync");
					self.store.clear();
					yield self.do_sync(true);
					cb();
				}
			}), 5 * 1000);
		}
		cb();
	};

	self.do_sync = function(do_download, cb) {
		yield self.ensure_login();
		if(do_download) {
			verbose("run!")
			yield self.sync.run();
		} else {
			verbose("push!")
			yield self.sync.push();
		}
		debug("now for a refresh")
		yield self.ui.refresh();
		cb();
	};

	self.clear_and_sync = function(do_download, cb) {
		self.store.clear();
		yield self.do_sync(do_download);
		cb();
	};

	self.ensure_login = function(cb){
		if(self.LOGGED_IN) { cb(); }
		yield self.reader.login(
			LOGIN_DETAILS.user || prompt('User'),
			LOGIN_DETAILS.password || prompt("Password"));
		self.LOGGED_IN = true;
		cb();
	};

	self.toggle_show_read = function(cb) {
		self.ui.entry_filter = self.ui.entry_filter ? null : Entry.is_unread;
		yield self.ui.render_tags(false);
		yield self.ui.render_feed(false);
	};
}.BakeConstructor();

