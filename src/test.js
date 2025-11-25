const fs = require('fs');
const source = fs.readFileSync("zig-out/bin/add-two.wasm");
const typedArray = new Uint8Array(source);

// Test the rot13 function
function testRot13(wasmInstance, wasmMemory, input, expected) {
    const inputBytes = Buffer.from(input, 'utf-8');
    const inputLength = inputBytes.length;

    // Allocate memory in Wasm for input
    const inputPtr = wasmInstance.exports.allocate(inputLength);
    if (inputPtr === 0) {
        throw new Error("Failed to allocate memory for input");
    }

    // Write input to Wasm memory
    const wasmMemoryView = new Uint8Array(wasmMemory.buffer);
    wasmMemoryView.set(inputBytes, inputPtr);

    // Call rot13 function
    const outputPtr = wasmInstance.exports.rot13(inputPtr, inputLength);
    if (outputPtr === 0) {
        wasmInstance.exports.deallocate(inputPtr, inputLength);
        throw new Error("rot13 function failed");
    }

    // Read output from Wasm memory
    const outputBytes = new Uint8Array(
        wasmMemory.buffer,
        outputPtr,
        inputLength
    );
    const result = Buffer.from(outputBytes).toString('utf-8');

    // Clean up allocated memory
    wasmInstance.exports.deallocate(inputPtr, inputLength);
    wasmInstance.exports.deallocate(outputPtr, inputLength);

    // Validate result
    if (result === expected) {
        console.log(`✓ PASS: "${input}" -> "${result}"`);
        return true;
    } else {
        console.log(`✗ FAIL: "${input}" -> "${result}" (expected "${expected}")`);
        return false;
    }
}

// Run tests
WebAssembly.instantiate(typedArray, {env: {}}).then(result => {
    const wasmInstance = result.instance;
    const wasmMemory = wasmInstance.exports.memory;

    console.log("Running ROT13 tests...\n");

    let passed = 0;
    let failed = 0;

    // Test cases: [input, expected output]
    const tests = [
        // Mixed case
        ["Hello", "Uryyb"],
        ["HELLO", "URYYB"],
        // Non-alphabetic characters (should remain unchanged)
        ["!@#$%", "!@#$%"],

        // Full alphabet
        ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "NOPQRSTUVWXYZABCDEFGHIJKLM"],
        ["abcdefghijklmnopqrstuvwxyz", "nopqrstuvwxyzabcdefghijklm"],
    ];

    tests.forEach(([input, expected]) => {
        if (testRot13(wasmInstance, wasmMemory, input, expected)) {
            passed++;
        } else {
            failed++;
        }
    });

    console.log(`\n========================================`);
    console.log(`Total: ${tests.length} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`========================================`);
}).catch(error => {
    console.error("Error loading WebAssembly module:", error);
    process.exit(1);
});
