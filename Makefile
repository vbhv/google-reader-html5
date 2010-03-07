COMPILED_JS="reader/psjs"
SRC_JS="ps"

parenscript:
	for f in $(SRC_JS)/*; do \
		base=`basename "$$f" .lisp`; \
		echo "making $(COMPILED_JS)/$$base.js"; \
		make $(COMPILED_JS)/"$$base.js"; \
	done

reader/psjs/%.js: ps/%.lisp
	./compile-js "$<" "$@"

clean:
	rm -f $(COMPILED_JS)/*.js

.PHONY: parenscript clean
