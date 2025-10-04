.PHONY: serve publish

rooturl = "https:\/\/github.com"

serve:
	php --server localhost:8090

publish:
	sed "s/.\/app/https:\/\/karintomania.github.io\/Human-Readable-Base4096\/app/" index.html > docs/index.html
	cp app.js app.css base4096.js ./docs/

test:
	node test.js
