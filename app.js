import {encode, decode, stringToUint8Array} from './base8192.js';
import {encoded} from './encoded_wasm.js';

const textDecoder = new TextDecoder();

async function decodeWasm() {
    const decoded = decode(encoded);
    const wasm = await WebAssembly.instantiate(new Uint8Array(decoded.result), {env: {}});

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

async function ready() {
    await decodeWasm();

    const encodedIn8192Text = document.querySelector('#encodedIn8192');
    const encodedIn64Text = document.querySelector('#encodedIn64');

    const encodedIn8192Count = document.querySelector('#encodedIn8192Count');

    const decodedText = document.querySelector('#decoded');
    const decodedError = document.querySelector('#decodeError');

    const toEncode = document.querySelector('#toEncode');
    const toDecode = document.querySelector('#toDecode');

    const encodeInput = () => {
        const str = toEncode.value;
        const bytes = stringToUint8Array(str);

        const encodedIn8192 = encode(bytes);
        const encodedIn64 = bytes.toBase64();

        encodedIn8192Text.innerText = encodedIn8192;
        encodedIn64Text.innerText = encodedIn64;

        encodedIn8192Count.innerText = `= ${encodedIn8192.length} characters (${encodedIn64.length} charactes in Base64).`;
    }

    const decodeInput = () => {
        const str = toDecode.value;

        const decodedResult = decode(str);

        const decoded = textDecoder.decode(new Uint8Array(decodedResult.result));

        console.log(decoded);

        decodeError.innerText = "";
        decodedText.innerText = decoded;

        if (decodedResult.errors.length > 0) {
            const innerHtml = decodedResult.errors.map(
                (msg) => `<li>${msg}</li>`
            ).join("");
            decodeError.innerHTML = innerHtml;
        }
    };

    toEncode.addEventListener('input', encodeInput, false);

    toDecode.addEventListener('input', decodeInput, false);

    encodeInput(); // encode initial input
}

if (document.readyState !== 'loading') {
  ready()
} else {
  document.addEventListener('DOMContentLoaded', ready)
}
