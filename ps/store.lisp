(defcls *store (mode)
	(setf (@ self entry-converter)
		(create
			on-save (lambda (e)
				(delete (@ e body-local))
				(delete (@ e date)))

			on-load (lambda (e)
				(setf (@ e date) (new (*date (@ e timestamp))))
				(setf (@ e body-local) (@ e body)))))

	(defun _table (name filters)
		(return (new (*lawnchair
			(create
				table name
				adaptor mode
				on-error (lambda (transaction err) (error (+ "DB error for table " name ": " err.message))))
		)))
	)

	(setf (@ self tags)         (_table "tags"))
	(setf (@ self feeds)        (_table "feeds"))
	(setf (@ self items)        (_table "items"))
	(setf (@ self action-store) (_table "actionStore"))
	(setf (@ self images)       (_table "images"))
	(setf (@ self version)      (_table "version"))
)

(add-meth_ *store set-valid-tags (tag-names)
	(defer current-tags (chain self tags (all)))
	(dolist (current-tag current-tags)
		(if (not (in_array (@ current-tag id) tag-names))
			(chain self tags (remove current-tag)))
	)
	(defer nil (map_ tag-names (lambda_ (tag-name)
		(defer tag (chain self tags (get tag-name)))
		(if (!= tag nil) (ret))
		(defer nil (chain self tags (save (create key tag-name entries []))))
		(debug (+ "added feed:" tag-name))
		(ret)
	)))
	(ret)
)

(add-meth_ *store is-empty ()
	(defer tags (chain self tags (all)))
	(ret (== 0 (@ tags length))))

(add-meth *store clear ()
	(var datastores
		(list
			(@ self tags)
			(@ self feeds)
			(@ self items)
			(@ self images)))
	(dolist (store datastores) (chain store (nuke))))


(add-meth_ *store get-all-tags () (ret_ (chain self tags (all))))
(add-meth_ *store get-active-tags () (ret_ (chain self tags (all))))

(add-meth_ *store get-tag-counts (tags filter)
	(defer all-items (chain self items (all)))
	(setf all-items (chain all-items (filter filter)))

	(var tag-counts {})
	(dolist (tag tags)
		(setf (@ tag-counts (@ tag key)) 0))

	(dolist (item all-items)
		(dolist (tag (@ item state tags))
			(incf (getprop tag-counts tag))
			(if (! (in tag tag-counts))
				(error (+ "unknown tag: " tag)))
	))

	(var tags-with-counts (_ j-query (map tags (lambda (tag)
		(return (create tag tag count (@ tag-counts (@ tag key))))))))
	
	(ret tags-with-counts))

(add-meth_ *store tag-with-entries (tag-name filter)
	(defer tag (chain self (tag tag-name)))
	(defer entries (map_ (@ tag entries) (lambda_ (entry)
		(defer entry (chain self items (get entry)))
		(chain self entry-converter (on-load entry))
		(ret_ (chain self (replace-with-stored-images entry)))
	)))
	(setf entries (chain entries (filter filter)))
	(setf (@ tag entry-objects) entries)
	(ret tag))

(add-meth_ *store add-entry (tag-name entry)
	(defer tag (_ self (tag tag-name)))
	(if (== tag nil)
		(progn
			(warn (+ "no such tag: " (chain *json* (stringify tag-name))))
			(ret)))
	(if (not (in_array (@ entry id) (@ tag entries)))
		(progn
			(chain tag entries (push (@ entry id)))
			(setf (@ entry key) (@ entry id))
			(chain self entry-converter (on-save entry))
			(defer nil (_ self items (save entry)))
			(defer nil (_ self tags (save tag)))
			(verbose
				(+ "added item " (@ entry id) " to tag " (@ tag key) " and now it has " (@ tag entries length)))
			(ret))
		(ret)
))

(add-meth_ *store toggle-flag (entry flag)
	(info (+ "toggling flag: " flag " on entry " entry))
	(var val (not (or (@ entry (getprop state flag)) false)))
	(defer nil (chain self (set-flag entry val)))
	(ret val))

(add-meth_ *store set-flag (entry flag val)
	(info (+ "setting flag: " flag " to " val " on entry " entry))
	(setf (@ entry (getprop state flag)) val)
	(chain self entry-converter (on-save) entry)
	(defer nil (chain self items (save entry)))
	(defer nil (chain self (add-action flag (@ entry id) val)))
	(ret))

(add-meth_ *store add-action (action key val)
	(var _arguments (chain *array prototype slice (call arguments)))
	(var args (chain arguments (slice 0 -1)))
	(ret_ (chain self (modify-actions (lambda (actions)
		(chain actions (push (list key val)))
		(debug (+ "added action: " key " :: " val)))))))

(add-meth_ *store remove-action (params)
	(defer actions (self modify-actions (lambda (actions)
		(var index (in_array params actions))
		(if (!== index false)
			(chain actions (splice index -1))
			(progn
				(debug (+ "all actions: " (chain *json* (stringify actions))))
				(error (+ "action not found to delete: " (chain *json* (stringify params)))))))))
	(ret))

(add-meth_ *store collapse-actions ()
	(var reversible (list "read" "star"))
	(var blacklist [])
	(var unique-actions [])
	(defer nil (chain self (modify-actions (lambda (actions)
		(chain j-query (each actions (lambda (i action)
			(if (!== false (in_array i blacklist))
				return)
			(var remaining-actions (chain actions (slice i)))
			(if (=== false (in_array (@ action 0) reversible))
				(progn
					(chain unique-actions (push action))
					return))
			(var opposite (chain action (slice)))
			(setf (@ opposite 2) (not (@ opposite 2)))
			(var opposite-index (in_array opposite remaining-actions))
			(if (=== false opposite-index)
				(chain unique-actions (push action))
				(progn
					(verbose (+ "dropping action " action " (" i ") && " (@ actions (+ i opposite-index))
											"( " (+ opposite-index i) ")"))
					(chain blacklist (push (+ opposite-index i))))))))
		))))
	(ret unique-actions))

(add-meth_ *store modify-actions (_do)
	(defer action-info (chain self (_get-action-info)))
	(var retval (_do (@ action-info values)))
	(if (instanceof retval *array)
		(setf (@ action-info values) retval))
	(ret (chain self action-store (save action-info))))

(add-meth_ *store _get-action-info ()
	(defer action-info (chain self action-store (get 1)))
	(if (== null action-info)
		(setf action-info (create key 1 values [])))
	(ret action-info))

(add-meth_ *store pending-actions ()
	(ret_ (chain self (collapse-actions))))

(add-meth_ *store save-image (img) (ret_ (chain self images (save img))))

(add-meth_ *store missing-images ()
	(defer all-used-images (chain self (_all-used-images)))
	(defer all-saved-images (chain self (_all-saved-images)))
	(ret (array-minus all-used-images all-saved-images)))

(add-meth_ *store remove-unused-images ()
	(defer all-used-images  (chain self (_all-used-images)))
	(defer all-saved-images (chain self (_all-saved-images)))

	(var unused-images (array-minus all-saved-images all-used-images))

	(dolist (img unused-images)
		(chain self images (remove img)))
	(ret))

(add-meth_ *store _all-used-images ()
	(defer all-items (chain self items (all)))
	(var images [])
	(chain j-query (each all-items (lambda (i item)
		(if (not (@ item state read))
			(if (instanceof (@ item images) *array)
				(setf images (chain images (concat (@ item images)))))))))
	(ret images))

(add-meth_ *store replace-with-stored-images (entry)
	(var body (@ entry body))
	(defer all-saved-images (chain self images (all)))

	(info (+ "replacing images in " (@ entry key) " (" (@ all-saved-images length) " images downloaded"))
	(chain j-query (each all-saved-images (lambda (i image)
		(var url (@ image key))
		(if (!= 1 (chain body (index-of url)))
			(progn
				(debug (+ "replacing image URL " url " with data: " (@ image data)))
				(chain body (replace url (@ image data) "gi")))))))
	(setf (@ entry body-local) body)
	(ret entry))

(add-meth_ *store delete-read-items ()
	(defer items (chain self items (all)))
	(dolist (item items)
		(if (@ item state read)
			(chain self items (remove (@ self key)))))
	(ret))

(add-meth_ *store _all-saved-images ()
	(defer all-saved-images (chain self images (all)))
	(setf all-saved-images (chain j-query (map all-saved-images (lambda (img) (return (@ img key))))))
	(ret all-saved-images))

(add-meth_ *store tag (tag-name)
	(defer tag (chain self tags (get tag-name)))
	(if (! tag)
		(ret nil)
		(progn
			(if (not (in "entries" tag))
				(setf (@ tag entries) []))
			(ret tag))))

