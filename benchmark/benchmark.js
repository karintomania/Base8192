import {encode} from '../base8192.js';
import {encode_w} from '../base8192_wasm.js';
import fs from 'fs';

async function test_encode() {
    const input = fs.readFileSync('./benchmark/test.csv');

    const startTime = performance.now()
    encode(input);
    const endTime = performance.now()

    console.log("JS encoding time: " + (endTime - startTime) + "ms.");
}

async function test_encode_wasm() {
    const input = fs.readFileSync('./benchmark/test.csv');

    const source = fs.readFileSync("zig-out/bin/base8192.wasm");
    const typedArray = new Uint8Array(source);

    const wasm = await WebAssembly.instantiate(typedArray, {env: {}});

    const wasmInstance = wasm.instance;
    const wasmMemory = wasmInstance.exports.memory;

    const startTime = performance.now()
    await encode_w(input, wasmInstance, wasmMemory);
    const endTime = performance.now()

    console.log("WASM encoding time: " + (endTime - startTime) + "ms.");
}

test_encode();
test_encode_wasm();
