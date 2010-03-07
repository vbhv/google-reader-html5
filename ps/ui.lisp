(defun *ui (store)
	(setf (@ self store) store)
	(setf (@ self tags-dom) (j-query "#tags"))
	(setf (@ self feed-dom) (j-query "#feed"))
	(setf (@ self entry-dom) (j-query "#entry"))

	(setf (@ self active-entry) nil)
	(setf (@ self entry-filter) (@ *entry is-unread))
	(setf (@ self views) (create
		:entry (new (*entry-view this))
		:feed  (new (*feed-view this (new (*entry-view this))))
		:taglist (new (*tag-list-view this (new (*tag-view this))))))

	(setf (@ self dom-areas) (list (@ self tags-dom) (@ self feed-dom) (@ self entry-dom)))

	(return self))
(bake-constructor *ui)

(add-meth *ui render (name obj)
	(return (chain (getprop (@ self views) name) (render obj))))

(add-meth_ *ui reload-tags ()
	(chain self tags-dom (empty))
	(defer tags (chain self store (get-active-tags)))
	(setf tags (chain tags (sort-by "key")))
	(debug (+ "UI: got " (@ tags length) " tags after reload"))
	(setf (@ self tags) tags)
	(ret_ (chain self (render-tags false))))

(add-meth_ *ui refresh ()
	(info "UI: refresh")
	(defer nil (chain self (reload-tags)))
	(verbose "UI: refresh complete")
	(ret))

(add-meth_ *ui load-tag (tag-name)
	(defer feed (chain self store (tag-with-entries tag-name (@ self entry-filter))))
	(setf (@ self active-feed) feed)
	(setf (@ feed entry-objects) (chain feed entry-objects (sort-by "date")))
	(ret_ (chain self (render-feed t))))

(add-meth_ *ui render-feed (force-display)
	(defer tags-with-counts (chain self store (get-tag-counts (@ self tags) (@ self entry-filter))))
	(var rendered-feed (chain (self (render "taglist" tags-with-counts))))
	(chain self tags-dom (empty) (append rendered-feed))
	(ret))

(add-meth *ui render-entry (entry)
	(setf (@ self active-entry) entry)
	(var rendered-entry (chain self (render "entry" entry)))
	(chain self entry-dom (empty) (append rendered-entry))
	(chain self (show (@ self entry-dom))))

(add-meth *ui show-feed-list () (chain self (show (@ self feed-dom))))
(add-meth *ui show-tags      () (chain self (show (@ self tags-dom))))
(add-meth *ui show-entry     () (chain self (show (@ self entry-dom))))

(add-meth_ *ui show-next (current)
	(defer nil (chain self (set-read current)))
	(defer nil (chain self (reader-entry-offset current 1)))
	(ret))

(add-meth_ *ui show-prev (current)
	(ret_ (chain self (reader-entry-offset current -1))))

(add-meth_ *ui reader-entry-offset (current)
	(var entry (chain self (get-entry-offset current offset)))
	(var render-func)
	(if (== nil entry)
		(setf render-func (lambda_ () (ret_ (chain self (render-feed t)))))
		(setf render-func (lambda_ () (ret (chain self (render-entry entry))))))
	(ret_ (render-func)))

(add-meth *ui get-entry-offset (current offset)
	(vr all-items (@ self active-feed entry-objects))
	(var item-keys (chain j-query (map all-items (lambda (i) (return (@ i key))))))
	(var index (chain j-query (in-array (@ current key) item-keys)))
	(if (== -1 index)
		(return nil))

	(var new-index (+ index offset))
	(if (or (< 0 new-index) (>= (@ all-items length) new-index))
		(return nil))

	(return (getprop all-items new-index)))

(add-meth_ *ui toggle (entry flag)
	(defer nil (chain self store (toggle-flag entry flag)))
	(chain self (update-toolbar entry))
	(ret))

(add-meth_ *ui toggle-read (entry) (ret_ (chain self (toggle entry "read"))))
(add-meth_ *ui toggle-star (entry) (ret_ (chain self (toggle entry "star"))))
; (add-meth_ *ui set-read (entry) (ret_ (chain self store (set-flag entry "read" t))))

(add-meth *ui update-toolbar (entry)
	(chain self (render-entry (@ self active-entry))))

(add-meth *ui show (dom)
	(dolist (area (@ this dom-areas))
		(if (== dom area)
			(chain this (show))
			(chain this (hide)))))


