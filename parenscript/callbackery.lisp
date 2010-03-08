(js:defmacro+ps _ (&rest body) `(ps:chain ,@body))

(defmacro println (&rest fmt-args)
	(setf (car fmt-args) (concatenate 'string (car fmt-args) "~%"))
	`(format t ,@fmt-args))

; last should get the last element, dammit!
(defun last-elem (l) (car (last l)))

(defun convert-single-statement (stmt)
	(if (atom stmt)
		stmt
		(if (eq 'defer (first stmt))
			(progn
				(unless (eq 3 (length stmt))
					(error (format nil "wrong number of forms for defer: ~a" stmt)))
				(let*
					(
						(arg (second stmt))
						(expr (third stmt))
						(result (wrap-return arg (convert expr) (convert *js-continuation*))))
					(setf *js-continuation* nil) ; the continuation has been dealt with now!
					result))
			(convert stmt))))

(defparameter *js-continuation* nil)

(defun convert (stmts)
	; (println "converting: ~a (~a)" stmts (length stmts))
	(if (eq 0 (length stmts))
		nil
		(let ((*js-continuation* (cdr stmts)))
			; (println "set continuation to ~a (=~a) while converting ~a" *js-continuation* (cdr stmts) (car stmts))
			(let ((this-statement (convert-single-statement (car stmts))))
				(cons this-statement (convert *js-continuation*))))
	))

(defun append-callback (expr cb)
	(if (or (eq (first expr) 'ps:chain) (eq (first expr) '_))
		(progn
			; (println "changing last elem to: ~a" (append (last-elem expr) `((lambda ,arglist ,@body-proc))))
			(setf (nth (- (length expr) 1) expr)
				(append (last-elem expr) (list cb)))
		)
		(progn
			; (println "~a != ~a" (first expr) 'chain)
			(setf expr (append expr (list cb))))
		)
	expr)

(defun wrap-return (arg expr body-proc)
	"turn an assignment into an expression with bundled callback
	(which executes body-proc)"
	; (println "wrap-return: called with ~a" `(,arg ,expr ,body-proc))
	(let (
			(arglist
				(if (eq nil arg)
					nil
					(list arg))))
		; (println "expr == ~a" expr)
		; (println "car expr == ~a" (car expr))
		; (println "last expr == ~a" (last-elem expr))
		(append-callback expr `(lambda ,arglist ,@body-proc))))

(js:defmacro+ps defun_ (name lambda-list &rest proc)
	`(defun ,name ,(append lambda-list `(cb)) ,@(convert proc)))

(js:defmacro+ps lambda_ (lambda-list &rest proc)
	`(lambda ,(append lambda-list `(cb)) ,@(convert proc)))

(js:defmacro+ps ret (&rest vals)
	`(progn
		(cb ,@vals)
		(return)))

(js:defmacro+ps ret_ (expr)
	`(progn
		,(append-callback expr 'cb)
		(return)))

(js:defmacro+ps add-meth (cls meth lambda-list &rest body)
	`(setf (ps:chain ,cls prototype ,meth) (lambda ,lambda-list (ps:var self this) ,@body)))

(js:defmacro+ps add-meth_ (cls meth lambda-list &rest body)
	`(setf (ps:chain ,cls prototype ,meth) (lambda_ ,lambda-list (ps:var self this) ,@body)))

(js:defmacro+ps bake-constructor (cls)
	`(setf ,cls (js:chain ,cls (*bake-constructor))))

(js:defmacro+ps defcls (name lambda-list &rest body)
	`(setf ,name (ps:chain
			(lambda ,lambda-list
				,@(append `((ps:var self this)) body `((return this))))
		(*bake-constructor))))
