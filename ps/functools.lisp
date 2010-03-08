(defun_ map_ (iterable func)
	(ret_ (_map-accum [] iterable func)))

(defun_ _map-accum (current iterable func)
	(if (== 0 (@ iterable length))
		(ret current))
	(var head (_ iterable (shift)))
	(defer result (func head))
	(chain current (push result))
	(ret_ (_map-accum current iterable func)))

(defun array-minus (a b)
	(var diff [])
	(dolist (obj a)
		(if (=== -1 (chain j-query (in-array obj b)))
			(chain diff (push obj))))
	(return diff))

