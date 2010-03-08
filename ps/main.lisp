(var app)

(_ *logging (set-level "debug"))

(defun main ()
	(var reader (new (*google-reader)))
	(var processor (new (*processor)))
	; (var store (new (*store "dom")))
	(var store (new (*store)))
	(var sync (new (*sync reader store processor)))
	(var ui (new (*ui store)))
	(setf app (new (*app reader store sync ui processor)))
	(chain app (main *null_cb*)))

(setf main (chain main (bake)))

; (j-query main)
($ (lambda ()
	(setf *google-reader (bake-constructor *google-reader))
	(main)))

(defun assign (x)
	(setf result x)
	(info (+ "result = " (chain *json* (stringify result))))
	)
