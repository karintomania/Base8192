import {
    stringToUint8Array,
    TwelveBits,
    TwelveBitsPair,
    TwelveBitsType,
    encode,
    decode,
} from './base8192.js';

const replacement = [0xEF, 0xBF, 0xBD];

//---------------
// test utilities
//---------------
const assertSame = (want, got) => {
    const msg = `Assert Failed! want: ${want}, got: ${got}`;
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
test("stringToUint8Array returns correct bytes", () => {
    const cases = [
        ["abc", [0x61, 0x62, 0x63]],
        ["🙏", [0xF0, 0x9F, 0x99, 0x8F]],
    ];

    cases.forEach(([str, want]) => {
        const got = stringToUint8Array(str);

        assertSame(want.length, got.length)

        for(let i = 0; i < got.length; i++) {
            assertSame(want[i], got[i]);
        }
    });
});

test("TwelveBits toString returns correct string", () => {
    const cases = [
        [[0x000, TwelveBitsType.LEFT], "一"],
        [[0xAAA, TwelveBitsType.LEFT], "墪"],
        [[0xFFF, TwelveBitsType.LEFT], "巿"],
        [[0x000, TwelveBitsType.RIGHT], "帀"],
        [[0xAAA, TwelveBitsType.RIGHT], "梪"],
        [[0xFFF, TwelveBitsType.RIGHT], "淿"],
        [[0x7B49, TwelveBitsType.PADDING], "等"],

        [[0x100, TwelveBitsType.RIGHT], "开"],
    ];

    cases.forEach(([[bits, type], want]) => {
        const twelveBits = new TwelveBits(bits, type);
        const got = twelveBits.toString();
        assertSame(want, got);
    })
});

test("TwelveBits toString validates bits and type", () => {
    const cases = [
        [[-0x001, TwelveBitsType.LEFT], "Bits must be unsigned 12 bits integer. 0x-1 given."],
        [[0x1000, TwelveBitsType.LEFT], "Bits must be unsigned 12 bits integer. 0x1000 given."],
        [[0x2D49, TwelveBitsType.LEFT], "Bits must be unsigned 12 bits integer. 0x2d49 given."],
        [[0x0000, TwelveBitsType.PADDING], "For padding, the bits should be 0x7b49"],
    ];

    cases.forEach(([[bits, type], want]) => {
        try {
            const twelveBits = new TwelveBits(bits, type);
        } catch (e) {
            assertSame(want, e);
        }
    })
});


test("TwelveBits fromString returns correct TwelveBits", () => {
    const cases = [
        [["一", TwelveBitsType.LEFT], 0x000],
        [["墪", TwelveBitsType.LEFT], 0xAAA],
        [["巿", TwelveBitsType.LEFT], 0xFFF],
        [["帀", TwelveBitsType.RIGHT], 0x000],
        [["梪", TwelveBitsType.RIGHT], 0xAAA],
        [["淿", TwelveBitsType.RIGHT], 0xFFF],
        [["开", TwelveBitsType.RIGHT], 0x100],
        [["等", TwelveBitsType.PADDING], 0x7B49],
    ];

    cases.forEach(([[str, type], want]) => {
        const got = TwelveBits.fromString(str, type);
        assertSame(want, got.bits);
        assertSame(type, got.type);
    })
});

test("TwelveBits fromString validates str and type", () => {
    const cases = [
        [["一", TwelveBitsType.RIGHT],  "一 is not a valid right twelve bit letter."],
        [["墪", TwelveBitsType.RIGHT], "墪 is not a valid right twelve bit letter."],
        [["巿", TwelveBitsType.RIGHT], "巿 is not a valid right twelve bit letter."],
        [["帀", TwelveBitsType.LEFT], "帀 is not a valid left twelve bit letter."],
        [["梪", TwelveBitsType.LEFT], "梪 is not a valid left twelve bit letter."],
        [["淿", TwelveBitsType.LEFT], "淿 is not a valid left twelve bit letter."],
        [["等", TwelveBitsType.LEFT], "等 is not a valid left twelve bit letter."],
    ];

    cases.forEach(([[str, type], want]) => {
        try {
            TwelveBits.fromString(str, type);
        }catch (e) {
            assertSame(want, e);
        }
    })
});

test("TwelveBitsPair from string to bytes", () => {
    const cases = [
        ["一淿",  [0x00, 0x0F, 0xFF]],
        ["吖恣",  [0x61, 0x62, 0x63]],
        ["一等",  [0x00]],
        ["丆开等",  [0x00, 0x61]],
    ];

    cases.forEach(([str, want]) => {
        const pair = TwelveBitsPair.fromString(str);

        const got = pair.toBytes();

        assertSame(want.length, got.length);

        for(let i = 0; i < want.length; i++ ) {
            assertSame(want[i].toString(16), got[i].toString(16));
        }
    })
});

test("TwelveBitsPair from bytes to string", () => {
    const cases = [
        [[0x00, 0x0F, 0xFF], "一淿"],
        [[0x61, 0x62, 0x63], "吖恣"],
        [[0x00], "一等"],
        [[0x00, 0x61], "丆开等"],
    ];

    cases.forEach(([bytes, want]) => {
        const pair = TwelveBitsPair.fromBytes(bytes);

        const got = pair.toString();

        assertSame(want, got);
    })
});


test("encode works", () => {
    const cases = [
        ["abc", "吖恣"],
        ["abcd", "吖恣呀等"], // handle mod(3)=1 bytes
        ["abcde", "吖恣呆挀等"], // handle mod(3)=2 bytes
        ["Hello, Base8192!!", "劆捬哆洬倄恡唶挴儃朶倒开等"], // handle mod(3)=2 bytes
        ["今日は、Base8192🙏", "屋榊屩斥尸徯尸庁刦彳呓戰冓擰培枏"],
    ];

    cases.forEach(([str, want]) => {
        const utf8Array = stringToUint8Array(str);

        const got = encode(utf8Array);

        assertSame(want, got);
    });
});

test("decode works", () => {
    const cases = [
        ["吖恣", [0x61, 0x62, 0x63]],
        ["一等", [0x00]],
        ["丆开等", [0x00, 0x61]],
    ];

    cases.forEach(([str, want]) => {
        const got = decode(str);

        assertSame(want.length, got.result.length)
        assertSame(0, got.errors.length)

        for(let i = 0; i < got.result.length; i++) {
            assertSame(want[i].toString(16), got.result[i].toString(16));
        }
    });
});

test("decode detects error", () => {
    const cases = [
        ["吖吖", [[...replacement, ...replacement], [
            "吖吖 is not a valid character pair in the position: 0",
            "吖 is not a valid character pair in the position: 1",
        ]]],
        ["吖恣呆吖", [[0x61, 0x62, 0x63, ...replacement, ...replacement], [
            "呆吖 is not a valid character pair in the position: 2",
            "吖 is not a valid character pair in the position: 3"
        ]]],
        ["吖恣恣等", [[0x61, 0x62, 0x63, ...replacement, ...replacement], [
            "恣等 is not a valid character pair in the position: 2",
            "等 is not a valid character pair in the position: 3"
        ]]],
        ["吖恣开", [[0x61, 0x62, 0x63, ...replacement], ["开 is not a valid character pair in the position: 2"]]],
        ["吖吖吖恣", [[...replacement, ...replacement, 0x61, 0x62, 0x63], [
            "吖吖 is not a valid character pair in the position: 0",
            "吖吖 is not a valid character pair in the position: 1"
        ]]],
    ];

    cases.forEach(([str, [result, errors]]) => {
        const got = decode(str);

        assertSame(result.length, got.result.length);
        assertSame(errors.length, got.errors.length);

        for (let i = 0; i < result.length; i ++) {
            assertSame(result[i], got.result[i]);
        }
        for (let i = 0; i < errors.length; i ++) {
            assertSame(errors[i], got.errors[i]);
        }
    });
});

