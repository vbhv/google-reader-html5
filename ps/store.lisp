(defun *store (mode)
	(setf (@ this entry-converter)
		(create
			on-save (lambda (e)
				(delete (@ e body-local))
				(delete (@ e date)))

			on-load (lambda (e)
				(setf (@ e date) (new (*date (@ e timestamp))))
				(setf (@ e body-local) (@ e body)))))

	(defun _table (name filters)
		(return (new (*lawnchair (create table name adaptor mode)))))

	(setf (@ this tags)         (_table "tags"))
	(setf (@ this feeds)        (_table "feeds"))
	(setf (@ this items)        (_table "items"))
	(setf (@ this action-store) (_table "action-store"))
	(setf (@ this images)       (_table "images"))
	(setf (@ this version)      (_table "version"))
	(return this)
)
(setf *store (chain *store (*bake-constructor)))


(add-meth_ *store set-valid-tags (tag-names)
	(defer current-tags (chain this tags (all)))
	(dolist (current-tag current-tags)
		(if (not (in_array (@ current-tag id) tag-names))
			(chain this tags (remove current-tag)))
	)
	(defer nil (map_ tag-names (lambda_ (tag-name)
		(defer tag (chain this tags (get tag-name)))
		(if (== tag nil)
			(defer nil (chain this tags (save (create key tag-name entries [])))))
		(debug (+ "added feed:" tag-name))
		(ret)
	)))
	(ret)
)

(add-meth_ *store is-empty ()
	(chain defer tags (chain self tags (all)))
	(ret (== 0 (@ tags length))))

(add-meth *store clear ()
	(var datastores
		(list
			(@ this tags)
			(@ this feeds)
			(@ this items)
			(@ this images)))
	(dolist (store datastores) (chain store (nuke))))


(add-meth_ *store get-all-tags () (ret_ (chain this tags (all))))
(add-meth_ *store get-active-tags () (ret_ (chain this tags (all))))

(add-meth_ *store get-tag-counts (tags filter)
	(defer all-items (chain this items (all)))
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

	(var tags-with-counts (jQuery_map tags (lambda (tag)
		(return (create tag tag count (@ tag-counts (@ tag key)))))))
	
	(ret tags-with-counts))

(add-meth_ *store tag-with-entries (tag-name filter)
	(defer tag (chain this (tag tag-name)))
	(defer entries (map (@ tag entries) (lambda_ (entry)
		(defer entry (chain this items (get entry)))
		(chain this entry-converter (on-load entry))
		(ret_ (chain this (replace-with-stored-images entry)))
	)))
	(setf entries (chain entries (filter filter)))
	(setf (@ tag entry-objects) entries)
	(ret tag))

(add-meth_ *store add-entry (tag-name entry)
	(defer tag (chain this (tag tag-name)))
	(if (== tag nil)
		(progn
			(warn (+ "no such tag: " (chain JSON (stringify tag-name))))
			(ret)))
	(if (not (in_array (@ entry id) (@ tag entries)))
		(progn
			(chain tag entries (push (@ entry id)))
			(setf (@ entry key) (@ entry id))
			(chain this entry-converter (on-save entry))
			(verbose
				(+ "added item " (@ entry id) " to tag " (@ tag key) " and now it has " (@ tag entries length)))
			(ret_ (chain this tags (save tag))))
		(ret)
))

(add-meth_ *store toggle-flag (entry flag)
	(info (+ "toggling flag: " flag " on entry " entry))
	(var val (not (or (@ entry (getprop state flag)) false)))
	(defer nil (chain this (set-flag entry val)))
	(ret val))

(add-meth_ *store set-flag (entry flag val)
	(info (+ "setting flag: " flag " to " val " on entry " entry))
	(setf (@ entry (getprop state flag)) val)
	(chain this entry-converter (on-save) entry)
	(defer nil (chain this items (save entry)))
	(defer nil (chain this (add-action flag (@ entry id) val)))
	(ret))

(add-meth_ *store add-action (action key val)
	(var _arguments (chain *array prototype slice (call arguments)))
	(var args (chain arguments (slice 0 -1)))
	(ret_ (chain this (modify-actions (lambda (actions)
		(chain actions (push (list key val)))
		(debug (+ "added action: " key " :: " val)))))))

(add-meth_ *store remove-action (params)
	(defer actions (self modify-actions (lambda (actions)
		(var index (in_array params actions))
		(if (!== index false)
			(chain actions (splice index -1))
			(progn
				(debug (+ "all actions: " (chain JSON (stringify actions))))
				(error (+ "action not found to delete: " (chain JSON (stringify params)))))))))
	(ret))

(add-meth_ *store collapse-actions ()
	(var reversible `(read star))
	(var blacklist [])
	(var unique-actions [])
	(defer nil (chain this (modify-actions (lambda (actions)
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
	(defer action-info (chain this (_get-action-info)))
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
	(ret_ (chain this (collapse-actions))))

(add-meth_ *store save-image (img) (ret_ (chain self images (save img))))

(add-meth_ *store missing-images ()
	(defer all-used-images (chain this (_all-used-images)))
	(defer all-saved-images (chain this (_all-saved-images)))
	(ret (array-minus all-used-images all-saved-images)))

(add-meth_ *store remove-unused-images ()
	(defer all-used-images  (chain this (_all-used-images)))
	(defer all-saved-images (chain this (_all-saved-images)))

	(var unused-images (array-minus all-saved-images all-used-images))

	(dolist (img unused-images)
		(chain self images (remove img)))
	(ret))

(add-meth_ *store _all-used-images ()
	(defer all-items (chain self items (all)))
	(var images [])
	(chain j-query (each all-items (lambda (i item)
		(if (not (@ item state read))
			(if (instanceof (@ elem item) *array)
				(setf images (chain images (concat (@ item images)))))))))
	(ret images))

(add-meth_ *store replace-with-stored-images (entry)
	(var body (@ entry body))
	(defer all-saved-images (chain this images (all)))

	(info (+ "replacing images in " (@ entry key) " (" (@ all-saved-images length) " images downloaded"))
	(chain j-query (each all-saved-images (lambda (i image)
		(var url (@ image key))
		(if (!= 1 (chain body (index-of url)))
			(progn
				(debug (+ "replacing image URL " url " with data: " (@ image data)))
				(chain body (replace url (@ image data) "gi")))))))
	(setf (@ entry body-local) body)
	(ret))

(add-meth_ *store delete-read-items ()
	(defer items (chain self items (all)))
	(dolist (item items)
		(if (@ item state read)
			(chain this items (remove (@ this key)))))
	(ret))

(add-meth_ *store _all-saved-images ()
	(defer all_saved_images (chain self images (all)))
	(setf all-saved-images (chain j-query (map all-saved-images (lambda (img) (return (@ img key))))))
	(ret all-used-images))

(add-meth_ *store tag (tag-name)
	(defer tag (chain self tags (get tag-name)))
	(if (! tag)
		(ret nil)
		(progn
			(if (not (in "entries" tag))
				(setf (@ tag entries) []))
			(ret tag))))

