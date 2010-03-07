parenscript:
	for f in ps/*; do \
		base=`basename "$$f" .lisp`; \
		echo "making reader/psjs/$$base.js"; \
		make reader/psjs/"$$base.js"; \
	done

reader/psjs/%.js: ps/%.lisp
	./compile-js "$<" "$@"

.PHONY: parenscript
