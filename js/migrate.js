var migrate = function(store) {
	var MIGRATE_KEY = 1;
	var CURRENT_VERSION = 0;
	var self = this;

	var migrations = {
	};

	var last_version = yield store.version.get(MIGRATE_KEY);
	last_version = last_version ? last_version.value : 0;
	debug("current database version: " + last_version);
	if(last_version != CURRENT_VERSION) {
		for(i=last_version+1; i<=CURRENT_VERSION; i++) {
			if(i in migrations) {
				warn("Migrating database up to version " + i);
				yield migrations[i].bake();
			}
		}
	}
	yield store.version.save({key:MIGRATE_KEY, value:CURRENT_VERSION});
}.bake();
