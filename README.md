# Base8192
Base8192 aims to be a more efficient encoding than Base64.

Here is the encoded JSON `{"message":"Hello👋 Base8192!"}` in Base8192 and Base64:

- **Base8192**: 喲恭呗慳吖敥倣栢劆捬哆淰培律倄恡唶挸儓朲倒恽
- **Base64**: eyJtZXNzYWdlIjoiSGVsbG/wn5GLIEJhc2U4MTkyISJ9

Try the interactive Base8192 encoder/decoder:  
https://karintomania.github.io/Base8192/

<img width="920" height="610" alt="Image" src="https://github.com/user-attachments/assets/21a63e7f-3d15-458f-93f6-9db762eb9745" />

## What is it?

### 4096 Characters to Represent 12 Bits

In Base64, binary is represented by alphanumeric letters, `+`, and `/`, which is 64 characters in total. Because `64 = 2^6`, **one character represents 6 bits in binary**.

If we use a character set containing `4096 = 2^12` characters, **one character can represent 12 bits of information**, which is double the information density of Base64.

But are there any character sets with 4096 printable and human-readable characters? Yes! **CJK Unified Ideographs** (commonly known as Chinese Characters or Kanji) provide over 20,000 characters in Unicode—more than enough to represent 12-bit values.

### 8192 Characters for Self-Synchronization

Base8192 uses **two sets of CJK characters** for error detection. Each pair of characters represents **24 bits = 3 bytes** of data:

- **Left character set**: U+4E00 - U+5DFF (一 to 巿) — 4096 characters
- **Right character set**: U+5E00 - U+6DFF (帀 to 淿) — 4096 characters

This approach makes the encoding **self-synchronized**: during decoding, if a character pair doesn't use the correct character sets, errors can be detected immediately.

## Features

🚀 **Double Character Efficiency** — 3 bytes → 2 characters (vs Base64's 3 bytes → 4 characters)
🔍 **Self-Synchronization** — Dual character sets enable automatic error detection during decoding
🈚 **Human-Readable CJK Characters** — Visually distinctive and compact representation
🌏 **International** — Valuing diversity and culture
💾 **Size Efficient** — Smaller byte size encoding compared to Base64 if stored in UTF-16
🎮 **Interactive Demo Available** — Try it out in your browser with live encoding/decoding

## How It Works

Let's compare Base64 and Base8192 using the ASCII string `abc`:

```
Binary:       0b01100001 (0x61), 0b01100010 (0x62), 0b01100011 (0x63)
Base64:       0b011000, 0b010110, 0b001001, 0b100011 → "YWJj"
Base8192:     0x616, 0x263 → "吖恣"
```

### Self-Synchronization

Every **3 bytes** converts to **2 CJK characters** (one "left" + one "right"):

- **Left characters**: U+4E00 - U+5DFF
- **Right characters**: U+5E00 - U+6DFF

If a character pair doesn't use the correct sets, the decoder can detect the error and handle it gracefully (e.g., in the demo, invalid pairs are replaced with �).

In the demo site, you can remove a random character from the encoded string and see how it detects the error.  
<img width="934" height="435" alt="Image" src="https://github.com/user-attachments/assets/35b1ef1e-29c3-4193-9e1e-a9144095f15a" />

### Padding
Similar to Base64, when the original data isn't a multiple of 3 bytes, padding is added to signal incomplete pairs.
Base8192 uses 等 (U+7B49) for padding, whereas Base64 uses `=`. The character 等 literally means "equal" in Chinese/Japanese.

## Usage
You can copy & paste base8192.js and use it as a JS module.

```javascript
import { encode, decode, stringToUint8Array } from './base8192.js';

// Encode binary data
const data = stringToUint8Array("Hello!");
const encoded = encode(data);
console.log(encoded); // Output: CJK characters

// Decode back to binary
const { result, errors } = decode(encoded);
console.log(result); // Output: original byte array
console.log(errors); // Output: any decoding errors
```

## FAQ

### Why use Base8192?

Base64 has a **3 bytes / 4 characters** ratio. Base8192 has a **3 bytes / 2 characters** ratio—**double the character efficiency**.
That being said, it's best not to use this in any production environment 😅

### Is it efficient in bytes?

Yes and no. If you use UTF-16 where ASCIIs and CJK characters are both 2 bytes, Base8192 is efficient.
But in UTF-8, CJK characters used in Base8192 are **3 bytes per character**, whereas ASCII characters in Base64 are **1 byte per character**, which makes Base8192 use 50% more bytes.

Also, Base8192 saves screen space in certain fonts and use cases as it has fewer characters than Base64.

### Is it human-readable?

Yes, especially if you happen to know how to read Chinese or/and Japanese.

### Comparison Table

Encoding the UTF-8 string `"abc"`:

| Metric | Base64 | Base8192 |
|--------|--------|----------|
| **Characters** | 4 letters | 2 letters ✅ |
| **Bytes in UTF-8** | 4 bytes | 6 bytes |
| **Bytes in UTF-16** | 8 bytes + BOM | 4 bytes + BOM ✅ |
| **Screen usage (variable-width fonts)** | Wide | Narrow ✅ |

> **Note**: On monospace fonts, CJK characters are typically twice as wide as ASCII, so screen usage is similar.

