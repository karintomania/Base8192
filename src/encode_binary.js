const fs = require('fs');

async function runWasm() {
    const source = fs.readFileSync("zig-out/bin/add-two.wasm");
    const typedArray = new Uint8Array(source);

    const wasm = await WebAssembly.instantiate(typedArray, {env: {}});

    const wasmInstance = wasm.instance;
    const wasmMemory = wasmInstance.exports.memory;

    const input = 'abcde';

    const inputBytes = typedArray;
    const inputLength = inputBytes.length;

    // allocate input
    const inputPtr = wasmInstance.exports.allocate(inputLength);

    const wasmMemoryView = new Uint8Array(wasmMemory.buffer);
    wasmMemoryView.set(inputBytes, inputPtr);

    const outputPtr = wasmInstance.exports.encode(inputPtr, inputLength);

    const outputLength = wasmInstance.exports.getEncodedLength(inputLength);

    const outputBytes = new Uint8Array(
        wasmMemory.buffer,
        outputPtr,
        outputLength,
    );

    const decoder = new TextDecoder('utf-8');
    const result = decoder.decode(outputBytes);
    console.log(result);

    wasmInstance.exports.deallocate(inputPtr, inputLength);
    wasmInstance.exports.deallocate(outputPtr, outputLength);
}


runWasm();
