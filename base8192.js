const textEncoder = new TextEncoder();

// "一":U+4E00
const baseCodePointLeft = 0x4E00;
// "帀":U+5E00
const baseCodePointRight = 0x5E00;

const replacement = [0xEF, 0xBF, 0xBD];

// use 等:U+7B49 for padding.
// 等 means equal, btw.
const padding12Bits = 0x7B49;
const paddingString = "等";

export const TwelveBitsType = Object.freeze({
    LEFT: 0,
    RIGHT: 1,
    PADDING: 2,
});

/**
 * @param {string} str
 * @return {Uint8Array}
 */
export function stringToUint8Array(str) {
    const utf8Array = new Uint8Array(str.length * 3);
    const result = textEncoder.encodeInto(str, utf8Array);
    return utf8Array.slice(0, result.written);
}

/**
 * @property {number} bits - 12 bits representation
 * @property {number} type - Use TwelveBitsType
 */
export class TwelveBits {
    constructor(bits, type) {
        if (type === TwelveBitsType.PADDING) {
            if (bits !== padding12Bits) {
                throw "For padding, the bits should be 0x" + padding12Bits.toString(16);
            }
        }else {
            if (bits < 0 || bits > (0xFFF)) {
                throw `Bits must be unsigned 12 bits integer. 0x${bits.toString(16)} given.`;
            }
        }

        this.bits = bits;
        this.type = type;
    }

    static fromString(str, type) {
        if (type === TwelveBitsType.PADDING) {
            if (str !== paddingString) {
                throw `Padding string needs to be ${paddingString}`;
            }

            return new TwelveBits(padding12Bits, type);
        }

        const codePoint = str.codePointAt(0);

        const baseCodePoint = (type === TwelveBitsType.LEFT)
            ? baseCodePointLeft
            : baseCodePointRight;

        if (codePoint < baseCodePoint || baseCodePoint + 0xFFF < codePoint) {
            const typeStr = (type === TwelveBitsType.LEFT) ? 'left' : 'right';
            throw `${str} is not a valid ${typeStr} twelve bit letter.`
        }

        const bits =  codePoint - baseCodePoint;

        return new TwelveBits(bits, type);
    }

    toString() {
        if (this.type === TwelveBitsType.PADDING) {
            return paddingString;
        }

        const baseCodePoint = (this.type === TwelveBitsType.LEFT)
                ? baseCodePointLeft 
                : baseCodePointRight;

        const codePoint = baseCodePoint + this.bits;

        return String.fromCodePoint(codePoint);
    }
};

export class TwelveBitsPair {
    constructor(left, right, padding) {
        this.left = left;
        this.right = right;
        this.padding = padding;
    }

    /**
     * @param {string} str - expects 2 letters of base8192 string
     */
    static fromString(str) {
        if (!(str.length === 2 || str.length === 3)) {
            throw "Expecting 2 or 3 base8192 letters.";
        }

        const left = TwelveBits.fromString(str[0], TwelveBitsType.LEFT);

        let right = null;
        let padding = null;

        if (str[1] === paddingString) {
            padding = TwelveBits.fromString(str[1], TwelveBitsType.PADDING);
        } else {
            right = TwelveBits.fromString(str[1], TwelveBitsType.RIGHT);
        }

        if (str.length === 3) {
            padding = TwelveBits.fromString(str[2], TwelveBitsType.PADDING);
        }

        return new TwelveBitsPair(left, right, padding);
    }

    toString() {
        const left = this.left.toString();

        const right = (this.right) ? this.right.toString() : "";

        const padding = (this.padding) ? this.padding.toString() : "";

        return left + right + padding;
    }

    static fromBytes(bytes) {
        if (bytes.length < 1 || 3 < bytes.length) {
            throw "Expecting 1 to 3 uint8 in array.";
        }

        let left, right, padding = null;

        // create left
        const leftBits = (bytes.length === 1) 
            ? bytes[0] << 4
            : bytes[0] << 4 | ((bytes[1] & 0b1111_0000) >> 4);

        left = new TwelveBits(leftBits, TwelveBitsType.LEFT);

        // create right
        if (bytes.length === 2) {
            const rightBits = (bytes[1] & 0b0000_1111) << 8;
            right = new TwelveBits(rightBits, TwelveBitsType.RIGHT);
        } else if (bytes.length === 3) {
            const rightBits = (bytes[1] & 0b0000_1111) << 8 | bytes[2];
            right = new TwelveBits(rightBits, TwelveBitsType.RIGHT);
        }

        // create padding
        if (bytes.length === 1 || bytes.length === 2) {
            padding = new TwelveBits(padding12Bits, TwelveBitsType.PADDING);
        }

        return new TwelveBitsPair(left, right, padding);
    }

    toBytes() {
        const result = Array();

        // get first byte
        result.push(this.left.bits >> 4);

        if (this.right) {
            // get second byte
            result.push((this.left.bits & 0b0000_0000_1111) << 4 | (this.right.bits >> 8));

            if (this.padding) {
                // 2 bytes
                return result;
            }else {
                // 3 bytes
                result.push(this.right.bits & 0b0000_1111_1111);

                return result;
            }
        }

        // only contains 1 byte
        return result;
    }
};

/**
 * @param {number[]} binary - array of u8 integer
 * @returns {string}
 */
export function encode(binary) {
    const count3BytesPairs = Math.floor(binary.length/3);
    const remainder = binary.length % 3;

    const twelveBitsPairs = Array();
    let i = 0

    for (; i < count3BytesPairs; i++ ) {
        const pair = TwelveBitsPair.fromBytes(
            binary.slice(i*3, i*3+3)
        );

        twelveBitsPairs.push(pair.toString());
    }

    if (remainder === 1) {
        const pair = TwelveBitsPair.fromBytes(binary.slice(i*3, i*3+1));
        twelveBitsPairs.push(pair.toString());
    } else if (remainder === 2) {
        const pair = TwelveBitsPair.fromBytes(
            binary.slice(i*3, i*3+2)
        );

        twelveBitsPairs.push(pair.toString());
    }

    return twelveBitsPairs.join("");
}

/**
 * decode result.
 * @typedef {Object} DecodeResult
 * @property {number[]} result - result of decode
 * @property {string[]} errors
 */

/**
 * @param {number[]} base8192Str - array of uint8
 * @returns {DecodeResult}
 */
export function decode(base8192Str) {
    if (base8192Str === "") {
        return Array();
    }

    const pairsCount = Math.floor(base8192Str.length / 2);
    const isEndWith3Letters = (base8192Str.length % 2) === 1;
    const hasPadding = base8192Str[base8192Str.length-1] === paddingString;

    const pairs = Array();
    const errors = Array();

    for (let i = 0; i < base8192Str.length;) {
        try {
            const leftStrCount = base8192Str.length - i;

            if (hasPadding && leftStrCount === 3) {
                // decode final 3 letters
                const pair = TwelveBitsPair.fromString(
                    base8192Str.slice(i, i+3)
                );

                i += 3;

                pairs.push(pair);

                continue;
            }

            const pair = TwelveBitsPair.fromString(
                base8192Str.slice(i, i+2)
            );

            i += 2;

            pairs.push(pair);

        } catch(e) {
            const invalidPair = base8192Str.slice(i, i+2);

            errors.push(`${invalidPair} is not a valid character pair in the position: ${i}`);

            pairs.push(null);

            i += 1;
        }
    }

    const result = pairs.flatMap(
        (pair) => (pair) ? pair.toBytes() : replacement
    );

    return {"result": result, "errors": errors};
}
