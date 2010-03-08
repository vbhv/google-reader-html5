(var *login-details {})
(var *tag-filter [])

(defcls *app (reader store sync ui processor)
	(setf (@ self reader) reader)
	(setf (@ self store) store)
	(setf (@ self ui) ui)
	(setf (@ self sync) sync)
	(setf (@ self processor) processor)
	(setf (@ self logged-in) false)
	)

(add-meth_ *app main ()
	(defer nil (migrate (@ self store)))
	(defer is-empty (chain self store (is-empty)))
	(if is-empty
		(progn
			(info "starting a sync")
			(ret (chain self (do-sync t)))))
	(verbose "no sync needed")
	(var success false)
	(chain self ui (refresh (lambda () (setf success t) (ret))))
	(chain window
		(set-timeout
			(lambda ()
				(if success (return))
				(warn "ui did not refresh after 5 seconds - forcing a fresh sync")
				(defer nil (chain self store (clear)))
				(ret_ (chain self (do-sync t))))
			(* 5 1000)))
	(ret))

(add-meth_ *app do-sync (do-download)
	(defer nil (chain self (ensure-login)))
	(var action)
	(if do-download
		(setf action (@ self sync run))
		(setf action (@ self sync push)))
	(defer nil (_ action (call self)))
	(debug "now for a refresh")
	(ret_ (chain self ui (refresh))))

(add-meth_ *app clear-and-sync (do-download)
	(chain self store (clear))
	(ret_ (chain self (do-sync do-download))))

(add-meth_ *app ensure-login ()
	(if (@ self logged-in) (ret))
	(defer nil (chain self reader
		(login
			(|| (@ *login-details user) (prompt "User:"))
			(|| (@ *login-details password) (prompt "Password:")))))
	(setf (@ self logged-in) t)
	(ret))

(add-meth_ *app toggle-show-read ()
	(setf (@ self ui filter)
		(if (@ self ui entry-filter) nil (@ *entry is-unread)))
	(defer nil (chain self ui (render-tags false)))
	(defer nil (chain self ui (render-feed false))))



