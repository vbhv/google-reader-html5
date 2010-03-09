(var app)

(_ *logging (set-level "debug"))

(defun_ _main ()
	; (var store (new (*store "dom")))
	(var store (new (*store)))
	(defer auth-token (_ store (get-auth-token)))
	(var reader (new (*google-reader
		(+ (_ document location href (replace (regex "^http:") "https:") (replace (regex "\\/reader.*") "/auth")))
		auth-token)))
	(var processor (new (*processor)))
	(var sync (new (*sync reader store processor)))
	(var ui (new (*ui store)))
	(setf app (new (*app reader store sync ui processor)))
	(chain app (main *null_cb*)))

(defun main ()
	(_main *NULL_CB*))

; (j-query main)
($ (lambda ()
	(setf *google-reader (bake-constructor *google-reader))
	(main)))

(defun assign (x)
	(setf result x)
	(info (+ "result = " (chain *json* (stringify result))))
	)
