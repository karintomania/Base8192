import {encode, decode, stringToUtf8BytesArray} from './base4096.js';

const textDecoder = new TextDecoder();

function ready() {
    const encodedIn4096Text = document.querySelector('#encodedIn4096');
    const encodedIn64Text = document.querySelector('#encodedIn64');

    const decodedText = document.querySelector('#decoded');
    const decodedError = document.querySelector('#decodeError');

    const toEncode = document.querySelector('#toEncode');
    const toDecode = document.querySelector('#toDecode');

    toEncode.addEventListener('input', function() {
        const str = toEncode.value;
        const bytes = stringToUtf8BytesArray(str);

        const encodedIn4096 = encode(bytes);
        const encodedIn64 = btoa(str);

        encodedIn4096Text.innerText = encodedIn4096;
        encodedIn64Text.innerText = encodedIn64;
    }, false);

    toDecode.addEventListener('input', function() {
        const str = toDecode.value;

        try {
            const bytes = decode(str);

            console.log(bytes);

            const decoded = textDecoder.decode(new Uint8Array(bytes));

            decodeError.innerText = "";
            decodedText.innerText = decoded;
        } catch (e) {
            decodeError.innerText = "Invalid Base4096 string!";
        }
    }, false);
}

if (document.readyState !== 'loading') {
  ready()
} else {
  document.addEventListener('DOMContentLoaded', ready)
}
