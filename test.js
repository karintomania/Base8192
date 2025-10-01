import {twelve_bits_to_base4096} from './base4096.js';

//---------------
// test utilities
//---------------
const assertSame = (want, got) => {
    const msg = `want: ${want}, got: ${got}`;
    console.assert(want === got, msg);
};

const test = (name, test_case) => {
    console.log(`[${name}]\nStarted.`);
    test_case();
    console.log(`Pass!\n`);
}


//---------------
// tests
//---------------
test("binary_to_base4096 returns correct character", () => {
    const cases = [
        [0b000000000000, "一"],
        [0b101010101010, "墪"],
        [0b111111111111, "巿"],
    ];

    cases.forEach(([binary, want]) => {
        const got = twelve_bits_to_base4096(binary);
        assertSame(want, got);
    })
});
