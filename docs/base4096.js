const textEncoder = new TextEncoder();

// "一":U+4E00
const baseCodePoint = 0x4E00;

// use 等:U+7B49 for padding.
// 等 means equal, btw.
const padding = 0x7B49;
const padding12Bits = padding - baseCodePoint;
const paddingString = "等";

/**
 * @param {number[]} binary - array of u8 integer
 * @returns {string}
 */
export function encode(binary) {
    const twelveBitArray = bytesTo12Bits(binary);

    const result = twelveBitArray.map(twelveBitsToBase4096).join("");

    return result;
}

export function stringToUtf8BytesArray(str) {
    const utf8Array = new Uint8Array(str.length * 3);
    const result = textEncoder.encodeInto(str, utf8Array);
    return utf8Array.slice(0, result.written);
}

function convert3BytesTo12Bits(pair) {
    const result  = Array();

    const first12Bits = (pair[0] << 4) | (pair[1] >> 4);

    const second12Bits = ((pair[1] & 0b00001111) << 8) | pair[2]

    result.push(first12Bits, second12Bits);

    return result;
}

function convert2BytesTo12Bits(firstByte, secondByte) {
    const first12Bits  = (firstByte << 4) | (secondByte >> 4);
    const second12Bits  = ((secondByte & 0b00001111) << 8);

    // add padding to flag the final bits doesn't exist for decoding
    return Array(first12Bits, second12Bits, padding12Bits);
}

function convertByteTo12Bits(byte) {
    const first12Bits = byte << 4;
    return Array(first12Bits, padding12Bits);
}

export function bytesTo12Bits(bytes) {
    const result = Array();
    const pairsCount = Math.floor(bytes.length / 3);
    const remainder = bytes.length % 3;

    for (let i=0; i<pairsCount; i++) {
        const end = Math.min(i*3+3, bytes.length);
        const pair = bytes.slice(i*3, end);

        result.push(...convert3BytesTo12Bits(pair));
    }

    if (remainder == 2) {
        const firstByte = bytes[3*pairsCount];
        const secondByte = bytes[3*pairsCount + 1];
        result.push(...convert2BytesTo12Bits(firstByte, secondByte));
    }

    if (remainder == 1) {
        const byte = bytes[3*pairsCount];
        result.push(...convertByteTo12Bits(byte));
    }

    return result;
}

export function twelveBitsToBase4096(binary) {
    const codePoint = baseCodePoint + binary;
    return String.fromCodePoint(codePoint);
}

function charToCode12Bits(char) {
    const codePoint = char.codePointAt(0);
    return codePoint - baseCodePoint;
}

export function base4096PairToBytes(first, second, is2Bytes = false) {
    const result = Array();

    const first12Bits = charToCode12Bits(first);
    const second12Bits = charToCode12Bits(second);

    const firstByte = first12Bits >> 4;

    if (second12Bits !== padding12Bits && !is2Bytes) {
        // result is 3 bytes
        const secondByte = (first12Bits & 0b0000_0000_1111) << 4 | (second12Bits >> 8);
        const thirdByte = second12Bits & 0b0000_1111_1111;

        result.push(firstByte, secondByte, thirdByte);
    } else if (second12Bits !== padding12Bits && is2Bytes) {
        // result is 2 bytes
        const secondByte = (first12Bits & 0b0000_0000_1111) << 4 | (second12Bits >> 8);

        result.push(firstByte, secondByte);
    } else {
        // result is single byte
        result.push(firstByte);
    }

    return result;
}

/**
 * @param {string} base4096Str
 * @returns {number[]}
 */
export function decode(base4096Str) {
    if (base4096Str === "") {
        return Array();
    }

    const pairsCount = Math.floor(base4096Str.length / 2);
    const isEndBytes2Bytes = (base4096Str.length % 2) === 1;

    if (isEndBytes2Bytes) {
        // if the length is even number, the final character should be padding.
        const lastChar = base4096Str[base4096Str.length - 1];
        console.assert(lastChar === paddingString, "The last character is invalid.");
    }

    const byteArray = Array();
    for (let i = 0; i < (pairsCount-1); i++) {
        const bytes = base4096PairToBytes(
            base4096Str[i*2],
            base4096Str[i*2+1],
            false,
        );

        byteArray.push(...bytes);
    }

    const endBytes = base4096PairToBytes(
        base4096Str[(pairsCount-1)*2],
        base4096Str[(pairsCount-1)*2+1],
        isEndBytes2Bytes,
    );

    byteArray.push(...endBytes);

    return byteArray;
}
