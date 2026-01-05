import {decode, stringToUint8Array} from './base8192.js';
import {encode_w, decode_w} from './base8192_wasm.js';
import {encoded} from './encoder.js';

const textDecoder = new TextDecoder();

async function decodeWasm() {
    const decoded = decode(encoded);
    const wasm = await WebAssembly.instantiate(new Uint8Array(decoded.result), {env: {}});

    const wasmInstance = wasm.instance;
    const wasmMemory = wasmInstance.exports.memory;

    return [wasmInstance, wasmMemory];
}

async function ready() {
    let wasmInstance, wasmMemory;
    [wasmInstance, wasmMemory] = await decodeWasm();

    const encodedIn8192Text = document.querySelector('#encodedIn8192');
    const encodedIn64Text = document.querySelector('#encodedIn64');

    const encodedIn8192Count = document.querySelector('#encodedIn8192Count');

    const decodedText = document.querySelector('#decoded');
    const decodedError = document.querySelector('#decodeError');

    const toEncode = document.querySelector('#toEncode');
    const toDecode = document.querySelector('#toDecode');

    const encodeInput = async () => {
        const str = toEncode.value;
        const bytes = stringToUint8Array(str);

        const encodedIn8192 = await encode_w(str, wasmInstance, wasmMemory);
        const encodedIn64 = bytes.toBase64();

        encodedIn8192Text.innerText = encodedIn8192;
        encodedIn64Text.innerText = encodedIn64;

        encodedIn8192Count.innerText = `= ${encodedIn8192.length} characters (${encodedIn64.length} charactes in Base64).`;
    }

    const decodeInput = async () => {
        const str = toDecode.value;

        const decodedResult = await decode_w(str, wasmInstance, wasmMemory);

        console.log(decodedResult);

        decodeError.innerText = "";
        decodedText.innerText = typeof decodedResult.result === 'string' ? decodedResult.result : textDecoder.decode(new Uint8Array(decodedResult.result));

        if (decodedResult.errors.length > 0) {
            const innerHtml = decodedResult.errors.map(
                (idx) => {
                    const msg = `Invalid sequence: ${str.substring(idx, idx+2)} at index ${idx}`;
                    return `<li>${msg}</li>`;
                }
            ).join("");
            decodeError.innerHTML = innerHtml;
        }
    };

    toEncode.addEventListener('input', encodeInput, false);

    toDecode.addEventListener('input', decodeInput, false);

    encodeInput(); // encode initial input
}

if (document.readyState !== 'loading') {
  ready();
} else {
  document.addEventListener('DOMContentLoaded', ready);
}
