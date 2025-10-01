const text_encoder = new TextEncoder();

export function encode(data) {
}

export function decode(data) {
}

export function get_utf8_array(str) {
    const utf8_array = new Uint8Array(str.length * 3);
    const encodedResults = textEncoder.encodeInto(string, utf8);
}

export function twelve_bits_to_base4096(binary) {
    const base_code_point = 0x04E00;
    const code_point = base_code_point + binary;
    return String.fromCodePoint(code_point);
}
