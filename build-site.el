;;; build-site.el --- Build Script for Personal Website -*- lexical-binding: t; -*-
;;
;; Copyright (C) 2023 Noelle Crawford
;;
;; Author: Noelle Crawford <noellec3@illinois.edu>
;; Maintainer: Noelle Crawford <noellec3@illinois.edu>
;; Created: May 18, 2023
;; Modified: May 19, 2023
;; Version: 0.0.2
;; Keywords: html org org-export-html-to-html ox-html ox-publish
;; Homepage: https://github.com/noelle/build-site ;; seems to be a dead link.
;; Package-Requires: ((emacs "24.3"))
;;
;; This file is not part of GNU Emacs.
;;
;;; Commentary:
;;
;;  Description
;;
;;; Code:

(require 'package)
(setq package-archives '(("org" . "https://orgmode.org/elpa/")
			                   ("elpa" . "https://elpa.gnu.org/packages/")))

;; Initialize the package system
(setq package-check-signature nil)
(package-initialize)
(package-refresh-contents)
(package-install 'use-package)

(require 'use-package)
(setq use-package-always-ensure t)

;; Install dependencies

;; Installing org is a little tricky -- we first need to get rid of the version
;; that comes with Emacs. We do this to get a newer version of org than built-in.

(use-package org :pin org)

;; Customize the HTML output
(setq org-html-validation-link nil)            ;; Don't show validation link
                                        ; org-html-head-include-scripts nil)       ;; Use our own scripts
                                        ; org-html-head-include-default-style nil ;; Use our own styles
                                        ;org-html-head "<link rel=\"stylesheet\" href=\"https://cdn.simplecss.org/simple.min.css\" />")

;; Define the publishing project
(setq org-publish-project-alist
      (list
       (list "org-site:main"
             :recursive t
             :base-extension "org"
             :base-directory "./content"
             :publishing-function 'org-html-publish-to-html
             :publishing-directory "./public"
             :with-author nil
             :with-creator nil
             :with-toc nil
             :section-numbers nil
             :time-stamp-file nil)
       ;; Images, favicon, etc.
       (list "org-static"
             :base-directory "./content"
             :base-extension "png\\|jpg\\|gif\\|pdf\\|svg\\|ico\\|xml\\|webmanifest"
             :publishing-directory "./public"
             :recursive t
             :publishing-function 'org-publish-attachment)
       (list "org-fonts"
             :base-directory "./content/fonts"
             :base-extension "ttf\\|eot\\|svg\\|css\\|woff"
             :publishing-directory "./public/fonts"
             :recursive t
             :publishing-function 'org-publish-attachment)
       ))

;; Generate the site output
(org-publish-all t)

(message "Build complete!")

;;; build-site.el ends here
