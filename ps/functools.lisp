(defun_ map (iterable func)
	(ret_ (map-accum [] iterable func)))

(defun_ map-accum (current iterable func)
	(if (== 0 (@ iterable length))
		(ret current))
	(defer result (func (chain iterable pop 0)))
	(chain current (push result))
	(ret (map-accum current iterable func)))
