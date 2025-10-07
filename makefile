.PHONY: serve publish

rooturl = "https:\/\/github.com"

serve:
	php --server localhost:8090

publish:
	sed "s/.\/app/https:\/\/karintomania.github.io\/Human-Readable-Base8192\/app/" index.html > docs/index.html
	cp app.js app.css base8192.js ./docs/

test:
	node test.js
