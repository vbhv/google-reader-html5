(defcls *sync (reader store processor)
	(setf (@ self reader) reader)
	(setf (@ self store) store)
	(setf (@ self processor) processor)
	(setf (@ self busy) false)
	)

(add-meth_ *sync pull-tags ()
	(defer tags (chain self reader (get-user-tags)))
	(ret_ (chain self store (set-valid-tags tags))))

(add-meth_ *sync pull-items (tag-name)
	(defer feed (_ self reader (get-tag-feed tag-name nil)))
	(ret_ (map_ (@ feed entries) (lambda_ (entry)
		(ret_ (_ self store (add-entry tag-name entry)))))))

(add-meth_ *sync _push ()
	(verbose "pushing")
	(defer pending-actions (chain self store (pending-actions)))
	(var progress (new (*progress-bar (@ pending-actions length) "pushing status")))
	(defer nil (map_ pending-actions (lambda_ (action)
		(var name (@ action 0))
		(var key (@ action 1))
		(var value (@ action 2))
		(var func nil)
		(if (== name "star") (setf func "set_star"))
		(if (== name "read") (setf func "set_read"))
		(if (== name "share") (setf func "set_public"))
		(if (== nil func)
			(progn
				(alert (+ "unknown action: " name))
				(return nil)))
		(verbose (+ "pushing state [" name "=" value "] for " key))
		(defer success ((getprop (@ self reader) func) key value))
		(var cleanup (@ self store remove-action))
		(if (not success)
			(progn
				(error (+ "failed pushing state: " name))
				(setf cleanup (lambda (action cb) (cb)))))
		(defer nil (cleanup action))
		(chain progress (add 1))
		(ret))))
		
		(verbose "removing read items")
		(defer nil (chain self store (delete-read-items)))

		(verbose "removing unused images")
		(defer nil (chain self store (remove-unused-images)))

		(chain progress (remove))
		(verbose "push complete")
		(ret))


(add-meth_ *sync _run ()
	(info "SYNC: run()")
	(defer nil (chain self (_push)))
	(chain self store (clear))
	(defer nil (chain self (pull-tags)))
	(defer active-tags (chain self store (get-active-tags)))
	(if (&& *tag-filter (!= 0 (@ *tag-filter length)))
		(progn
			(info (+ "filtering tags to just " (chain *json* (stringify *tag-filter))))
			(setf active-tags (chain active-tags (filter (lambda (tag)
				(return (!= -1 (chain *tag-filter (index-of (@ tag key)))))))))))

	(verbose (+ "SYNC: there are " (@ active-tags length) " active tags"))
	(var progress (new (*progress-bar (@ active-tags length) "downloading tags")))

	(defer nil (map_ active-tags (lambda_ (tag)
		(chain progress (add 1))
		(defer nil (chain self (pull-items (@ tag key))))
		(debug (+ "tag " (@ tag key) " downloaded"))
		(ret))))
	(chain progress (remove))
	(debug "setting up a callback to mirror images...")
	(chain window
		(set-timeout
			(lambda () (_ self (mirror-images *null_cb*)))
			100))
	(ret))

(add-meth_ *sync mirror-images ()
	(defer missing-images (chain self store (missing-images)))
	(verbose (+ "downloading " (@ missing-images length) " missing images"))
	(if (== 0 (@ missing-images length)) (ret))
	(var progress (new (*progress-bar (@ missing-images length) "downloading images")))
	(defer nil (map_ missing-images (lambda_ (url)
		(chain progress (add 1))

		(debug (+ "downlading image: " url))
		(*GET* url nil
			(lambda (data response-code xhr)
				(var mime-type (chain xhr (get-response-header "Content-type")))
				(debug (+ "download image: " url " (" mime-type ")"))
				(setf data (+ "data:" mime-type ";base64," (chain *base64 (encode data))))
				(defer nil (chain self (save-image (create :key url :data data))))
				(ret))
			(lambda () (ret))))))
	(ret))

(add-meth_ *sync push ()
	(ret_ (chain self (locked (lambda_ ()
		(ret_ (chain self (_push))))))))

(add-meth_ *sync run ()
	(ret_ (chain self (locked (lambda_ ()
		(ret_ (chain self (_run))))))))

(add-meth_ *sync locked (func)
	(if (@ self busy)
		(progn
			(info (+ self " is busy"))
			(ret)))
	(setf (@ self busy) t)
	(defer nil (chain func (call self)))
	(setf (@ self busy) false)
	(ret))

