import {
    twelveBitsToBase4096,
    stringToUtf8BytesArray,
    bytesTo12Bits,
    encode,
    decode,
} from './base4096.js';

//---------------
// test utilities
//---------------
const assertSame = (want, got) => {
    const msg = `want: ${want}, got: ${got}`;
    console.assert(want === got, msg);
};

const test = (name, testCase) => {
    console.log(`[${name}]\nStarted.`);
    testCase();
    console.log(`Done!\n`);
}


//---------------
// tests
//---------------
test("binary_to_base4096 returns correct character", () => {
    const cases = [
        [[0x000, true], "一"],
        [[0xAAA, true], "墪"],
        [[0xFFF, true], "巿"],
        [[0x000, false], "帀"],
        [[0xAAA, false], "梪"],
        [[0xFFF, false], "淿"],
    ];

    cases.forEach(([[binary, isFirst], want]) => {
        const got = twelveBitsToBase4096(binary, isFirst);
        assertSame(want, got);
    })
});

test("stringToUtf8BytesArray returns correct bytes", () => {
    const cases = [
        ["abc", [0x61, 0x62, 0x63]],
        ["🙏", [0xF0, 0x9F, 0x99, 0x8F]],
    ];

    cases.forEach(([str, want]) => {
        const got = stringToUtf8BytesArray(str);

        assertSame(want.length, got.length)

        for(let i = 0; i < got.length; i++) {
            assertSame(want[i], got[i]);
        }
    });
});

test("bytesTo12Bits", () => {
    const cases = [
        // a: 0x61, b: 0x62...
        ["abcdef", [0x61_6, 0x2_63, 0x64_6, 0x5_66]],
        ["abcd", [0x61_6, 0x2_63, 0x64_0, 0x2d49]], // handle mod(3)=1 bytes
        ["abcde", [0x61_6, 0x2_63, 0x64_6, 0x5_00, 0x2d49]], // handle mod(3)=2 bytes
    ];

    cases.forEach(([str, want]) => {
        const utf8Array = stringToUtf8BytesArray(str);

        const got = bytesTo12Bits(utf8Array);

        assertSame(want.length, got.length)

        for(let i = 0; i < got.length; i++) {
            assertSame(want[i].toString(16), got[i].toString(16));
        }
    });
});

test("encode works", () => {
    const cases = [
        ["abc", "吖恣"],
        ["abcd", "吖恣呀等"], // handle mod(3)=1 bytes
        ["abcde", "吖恣呆挀等"], // handle mod(3)=2 bytes
        ["Hello, Base4096!!", "劆捬哆洬倄恡唶挴儃朶倒开等"], // handle mod(3)=2 bytes
        ["今日は、Base4096🙏", "屋榊屩斥尸徯尸庁刦彳呓戰冓擰培枏"],
    ];

    cases.forEach(([str, want]) => {
        const utf8Array = stringToUtf8BytesArray(str);

        const got = encode(utf8Array);

        assertSame(want, got);
    });
});

// test("decode works", () => {
//     const cases = [
//         ["吖偣", [0x61, 0x62, 0x63]],
//         ["呀等", [0x64]],
//         ["呆匀等", [0x64, 0x65]]
//     ];

//     cases.forEach(([str, want]) => {
//         const got = decode(str);

//         assertSame(want.length, got.length)

//         for(let i = 0; i < got.length; i++) {
//             assertSame(want[i].toString(16), got[i].toString(16));
//         }
//     });
// });

// test("encode & decode goes back to original", () => {
//     const cases = [
//         "",
//         "1",
//         "12",
//         "123",
//         "hello $base4096!!",
//         "multibytes letters: マルチバイト文字列",
//     ];

//     cases.forEach((str) => {
//         const bytes = stringToUtf8BytesArray(str);
//         const encoded = encode(bytes);

//         const decoded = decode(encoded);

//         assertSame(bytes.length, decoded.length);

//         for(let i = 0; i < bytes.length; i++) {
//             assertSame(bytes[i].toString(16), decoded[i].toString(16));
//         }
//     });
// });
