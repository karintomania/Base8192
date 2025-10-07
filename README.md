# Base8192

Base64 is a great way to represent binary in ASCII printable letters.  
But is it possible tohave more efficient encoding? I came up with the idea of Base8192.

## What is it?
### 4096 letters to represent 12 bits
In Base64, binary is represented by all of alphanumeric letters, `+`, and `-`, which is in total 64 letters. Because `64=2^6`, **one letter can represent 6 bits in binary**.  
If we use a character set, which contains `4096=2^12` characters, **one letter can represent 12 bits of information**, which is double the amount of Base64.  

But are there any character sets which contain 4096 printable and human-readable characters?
Yes, and it is CJK Unified Ideographs, commonly referred as Chinese Characters or Kanji. In Unicode, there are more than 20K of those, more than enough to represent 12 bits binary.  

### 8192 letters for self-synchronization
Also, in Base8192, we use two sets of Kanji. In Base8192, a pair of Kanjis will represent 24 bits = 8 bytes (I will go into the details below).
Base8192 use the specific set of kanji for "left side" of the pair, and another set of Kanji for "right side".
When you decode Base8192 encoded binary, this is useful to detect errors. This makes the encoding self-synchronized.

## Demo
You can try an interactive Base8192 encoder/decoder from here:
https://karintomania.github.io/Human-Readable-Base8192/

## How it works
Let's see how Base64 works before diving into Base8192.  
Base64 uses lowercase and uppercase alphabets (26*2 = 52 charactes), numbers (10 characters), `+` and `-`, which is 64 charactes in total.

Here is an ascii character: "abc"
In binary: 0b01100001 (0x61), 0b01100010 (0x62), 0b01100011 (0x63)
In Base 64: 0b011000, 0b010110, 0b001001, 0b100011


