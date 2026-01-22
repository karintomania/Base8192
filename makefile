.PHONY: serve publish test benchmark build gen-js

serve:
	php --server localhost:8090

publish:
	sed "s/.\/app/https:\/\/karintomania.github.io\/Base8192\/app/" index.html > docs/index.html
	cp app.js app.css base8192.js base8192_wasm.js encoder.js ./docs/

test:
	node test.js

benchmark:
	node benchmark/benchmark.js

build:
	zig build

gen-js: clean
	zig build --release=small
	node self-encode.js

clean:
	rm -f zig-out/bin/* encoder.js
