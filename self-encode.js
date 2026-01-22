import fs from 'fs';
import {encode_w_binary} from './base8192_wasm.js';

async function encode_self() {
    const sourceBinary = fs.readFileSync("./zig-out/bin/base8192.wasm");
    const typedArray = new Uint8Array(sourceBinary);

    const wasm = await WebAssembly.instantiate(typedArray, {env: {}});

    const wasmInstance = wasm.instance;
    const wasmMemory = wasmInstance.exports.memory;

    const result = await encode_w_binary(sourceBinary, wasmInstance, wasmMemory);

    fs.writeFileSync("./encoder.js", `export const encoded = "${result}";`);
}

encode_self();
