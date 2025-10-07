import {encode, decode, stringToUint8Array} from './base8192.js';

const textDecoder = new TextDecoder();

function ready() {
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
