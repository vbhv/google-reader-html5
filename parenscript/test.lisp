(load "~/.clisprc.lisp")
(load "lisp-unit.lisp")
(use-package :lisp-unit)
(asdf:operate 'asdf:load-op :parenscript)

(load "callbackery.lisp")

(define-test "lambda insertion (wrap-return)"
	(assert-equal
		`(func "arg1" "arg2" (lambda (x) (print x) x))
		(wrap-return `x `(func "arg1" "arg2") `( (print x) x )))
)

(define-test "convert normal statements"
	(let ((stmts `((foo x) (print x) (print (foo (bar x y z))))))
		(assert-equal stmts (convert stmts)))
	(assert-equal
		`(x y z)
		(convert `(x y z))))

(define-test "convert single defer"
	(assert-equal
		`((print "foo") (get-image (lower "img1") (lambda (img) (print img) (print img))))
		(convert `((print "foo") (defer img (get-image (lower "img1"))) (print img) (print img)))
		))

(define-test "convert chained function call"
	(assert-equal
		`((ps:chain img-store (get-image img-id (lambda (img) (alert img)))))
		(convert `((defer img (ps:chain img-store (get-image img-id))) (alert img)))))

(define-test "convert multiple (nested) defers"
	(assert-equal
		`(
			(get-image
				(lower "img1")
				(lambda (img)
					(get-image
						"img2"
						(lambda
							(img2)
							(print img)
							(print img2))))))
		(convert `((defer img (get-image (lower "img1"))) (defer img2 (get-image "img2")) (print img) (print img2)))
	)

	(assert-equal
		`(
			(while cond
				(lambda (elem)
					(get-image "img1" (lambda (img1) (print img1))))
				(lambda ()
					(get-image "img2" (lambda (img2) (print img))))))
		(convert `(
			(defer nil
				(while cond
					(lambda (elem)
						(defer img1 (get-image "img1"))
						(print img1))))
			(defer img2 (get-image "img2"))
			(print img)
		))
	)
)

(define-test "single-statement folding"
	(let ((*js-continuation* `(x y z)))
		(assert-equal
			`(get-image id (lambda (x) x y z))
			(convert-single-statement `(defer x (get-image id))))
		(assert-equal *js-continuation* nil)))


(run-tests)
