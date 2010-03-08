(defun_ migrate (store)
	(var migrate-key 1)
	(var current-version 0)
	(var self this)

	(var migrations (list))

	(defer last-version (_ store version (get migrate-key)))
	(debug (+ "current DB version: " last-version))
	(if (>= current-version last-version) (ret))

	(defer nil (map_ migrations (lambda_ (migration)
		(if (> (@ migration version) last-version)
			(progn
				(warning (+ "migrating DB up to version: " (@ migration version)))
				(ret_ (_ migration (call))))))))

	(ret_ (_ store version (save (create :key migrate-key :value current-version))))
	)

