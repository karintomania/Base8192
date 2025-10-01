# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Base4096 encoding library that converts binary data into human-readable CJK characters. The encoding uses 12-bit chunks mapped to Unicode code points starting at U+4E00, resulting in compact, visually distinctive text representations.

## Commands

- **Run tests**: `make test` or `node test.js`
- **Start local server**: `make serve` (runs PHP server on localhost:8090)
- **Build for publishing**: `make publish` (updates public/ directory with production files)

## Architecture

### Core Encoding System

The project implements a Base4096 encoding scheme:
- **12-bit encoding**: Each 12-bit chunk of binary data maps to a single CJK character
- **Base code point**: U+4E00 (一) serves as the base, with offsets up to 4095 (0xFFF)
- **Character range**: U+4E00 to U+5DFF covers all 4096 possible 12-bit values

### File Structure

- `base4096.js`: Core encoding/decoding functions and UTF-8 utilities
- `test.js`: Test suite with custom test framework (assertSame, test)
- `app.js`: Entry point for the web application
- `index.html`: Web interface for the encoder/decoder
- `public/`: Production build output directory

### Key Implementation Notes

- Uses ES6 modules (`import`/`export`)
- `twelve_bits_to_base4096()` in base4096.js:15 is the core encoding function
- Implements custom UTF-8 array handling via `get_utf8_array()`
- Test framework provides `assertSame()` and `test()` utilities

## Development Workflow

When modifying encoding logic:
1. Update functions in `base4096.js`
2. Run `make test` to verify correctness
3. Test locally with `make serve`
4. Run `make publish` to update production files
