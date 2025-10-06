import {encode, decode, stringToUint8Array} from './base4096.js';

const textDecoder = new TextDecoder();

function ready() {
    const encodedIn4096Text = document.querySelector('#encodedIn4096');
    const encodedIn64Text = document.querySelector('#encodedIn64');

    const encodedIn4096Count = document.querySelector('#encodedIn4096Count');

    const decodedText = document.querySelector('#decoded');
    const decodedError = document.querySelector('#decodeError');

    const toEncode = document.querySelector('#toEncode');
    const toDecode = document.querySelector('#toDecode');

    const encodeInput = () => {
        const str = toEncode.value;
        const bytes = stringToUint8Array(str);

        const encodedIn4096 = encode(bytes);
        const encodedIn64 = bytes.toBase64();

        encodedIn4096Text.innerText = encodedIn4096;
        encodedIn64Text.innerText = encodedIn64;

        encodedIn4096Count.innerText = `= ${encodedIn4096.length} characters (${encodedIn64.length} charactes in Base64).`;
    }

    const decodeInput = () => {
        const str = toDecode.value;

        try {
            const bytes = decode(str);

            const decoded = textDecoder.decode(new Uint8Array(bytes));

            decodeError.innerText = "";
            decodedText.innerText = decoded;
        } catch (e) {
            decodeError.innerText = e;
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
