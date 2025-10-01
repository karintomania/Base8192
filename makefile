.PHONY: serve publish

rooturl = "https:\/\/github.com"

serve:
	php --server localhost:8090

publish:
	sed "s/.\/app.js/https:\/\/github.com\/app.js/" index.html > public/index.html
	cp app.js ./public/

test:
	node test.js
