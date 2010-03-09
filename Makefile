COMPILED_JS="reader/psjs"
SRC_JS="ps"

parenscript:
	for f in $(SRC_JS)/*; do \
		base=`basename "$$f" .lisp`; \
		echo "making $(COMPILED_JS)/$$base.js"; \
		make $(COMPILED_JS)/"$$base.js" || exit 1; \
	done

reader/psjs/%.js: ps/%.lisp
	./compile-js "$<" "$@"

clean:
	rm -f $(COMPILED_JS)/*.js

server:
	~/.google/appengine/dev_server.py .

update:
	echo "really update a new version? "; read "response"; \
	[ "$$response" = "yes" ] && ~/.google/appengine/appcfg.py update .

rollback:
	~/.google/appengine/appcfg.py rollback  .


.PHONY: parenscript clean server update rollback
