const fs = require('fs');
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

async function runWasm() {
    const source = fs.readFileSync("zig-out/bin/base8192.wasm");
    const typedArray = new Uint8Array(source);

    const wasm = await WebAssembly.instantiate(typedArray, {env: {}});

    const wasmInstance = wasm.instance;
    const wasmMemory = wasmInstance.exports.memory;

    await test_encode(wasmInstance, wasmMemory);
    await test_decode(wasmInstance, wasmMemory);
}

async function test_encode(wasmInstance, wasmMemory) {
    const input = 'abcde';

    const inputBytes = encoder.encode(input);
    const inputLength = inputBytes.length;

    // allocate input
    const inputPtr = wasmInstance.exports.allocate(inputLength);

    const wasmMemoryView = new Uint8Array(wasmMemory.buffer);
    wasmMemoryView.set(inputBytes, inputPtr);

    const outputPtr = wasmInstance.exports.encode(inputPtr, inputLength);

    const result = parseWasmStringPointer(outputPtr, wasmMemory, wasmInstance);

    console.log(result);

    wasmInstance.exports.deallocate(inputPtr, inputLength);
}

async function test_decode(wasmInstance, wasmMemory) {
    const input = "吖恣";

    const inputBytes = encoder.encode(input);
    const inputLength = inputBytes.length;


    const inputPtr = wasmInstance.exports.allocate(inputLength);
    const wasmMemoryView = new Uint8Array(wasmMemory.buffer);
    wasmMemoryView.set(inputBytes, inputPtr);

    const outputPtr = wasmInstance.exports.decode(inputPtr, inputLength);

    const result = parseWasmStringPointer(outputPtr, wasmMemory, wasmInstance);

    console.log(result);

    wasmInstance.exports.deallocate(inputPtr, inputLength);
}

function parseWasmStringPointer(ptr, wasmMemory, wasmInstance) {
    // read first 4 bytes = length of the result
    const outputLen = new Uint32Array(
        wasmMemory.buffer,
        ptr,
        1,
    )[0];

    const outputBytes = new Uint8Array(
        wasmMemory.buffer,
        ptr + 4,
        outputLen,
    );

    const result = decoder.decode(outputBytes);

    wasmInstance.exports.deallocate(ptr, outputLen+4);

    return result;
}

runWasm();
