# Human Readable Base4096

Base64 is a great way to represent binary in ASCII printable letters.  
But I want to push the idea to the edge and came up with the idea of Base4096.

## What is it?
In Base64, binary is represented by all of alphanumeric letters, `+`, `-`, which is in total 64 letters. Because `64=2^6`, **one letter can represent 6 bits in binary**.  
If we use a character set, which contains `4096=2^12` characters, **one letter can represent 12 bits of information**, which is double the amount of Base64.  

But are there any character sets which contain 4096 printable and human-readable characters?
Yes, and it is CJK Unified Ideographs, commonly referred as Chinese Characters or Kanji. In Unicode, there are more than 20K of those, more than enough to represent 12 bits binary.  

## Demo
You can try an interactive Base4096 encoder/decoder from here:
https://karintomania.github.io/Human-Readable-Base4096/

## How it works
Let's see how Base64 works before diving into Base4096.  
Base64 uses lowercase and uppercase alphabets (26*2 = 52 charactes), numbers (10 characters), `+` and `-`, which is 64 charactes in total.

