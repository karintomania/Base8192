const fs = require('fs');

async function runWasm() {
    const source = fs.readFileSync("zig-out/bin/base8192.wasm");
    const typedArray = new Uint8Array(source);

    const wasm = await WebAssembly.instantiate(typedArray, {env: {}});

    const wasmInstance = wasm.instance;
    const wasmMemory = wasmInstance.exports.memory;

    const input = 'abcde';

    const encoder = new TextEncoder();
    const inputBytes = encoder.encode(input);
    const inputLength = inputBytes.length;

    // allocate input
    const inputPtr = wasmInstance.exports.allocate(inputLength);

    const wasmMemoryView = new Uint8Array(wasmMemory.buffer);
    wasmMemoryView.set(inputBytes, inputPtr);

    const outputResultPtr = wasmInstance.exports.encode(inputPtr, inputLength);

    // read first 4 bytes = length of the result
    const outputLen = new Uint32Array(
        wasmMemory.buffer,
        outputResultPtr,
        1,
    )[0];

    // read encoded string
    const outputBytes = new Uint8Array(
        wasmMemory.buffer,
        outputResultPtr + 4,
        outputLen,
    );

    const decoder = new TextDecoder('utf-8');
    const result = decoder.decode(outputBytes);
    console.log(result);

    wasmInstance.exports.deallocate(inputPtr, inputLength);
    wasmInstance.exports.deallocate(outputResultPtr, outputLen+4);
}


runWasm();
