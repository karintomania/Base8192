const std = @import("std");

// Use the WebAssembly-specific allocator for freestanding target
const allocator = std.heap.wasm_allocator;

/// Allocate memory accessible from JavaScript
/// Returns a pointer that JS can write to
pub export fn allocate(size: usize) ?[*]u8 {
    const slice = allocator.alloc(u8, size) catch return null;
    return slice.ptr;
}

/// Deallocate memory previously allocated
/// JS should call this to free memory after reading results
pub export fn deallocate(ptr: [*]u8, size: usize) void {
    const slice = ptr[0..size];
    allocator.free(slice);
}

/// Rotate a single ASCII character by 13 positions
/// Only affects A-Z and a-z, leaves other characters unchanged
fn rotateChar(c: u8) u8 {
    return switch (c) {
        'A'...'M' => c + 13,
        'N'...'Z' => c - 13,
        'a'...'m' => c + 13,
        'n'...'z' => c - 13,
        else => c,
    };
}

/// Apply ROT13 encoding to a string
/// Takes pointer to input string and its length
/// Returns pointer to newly allocated result string
/// JS must call deallocate() with the returned pointer and length when done
pub export fn rot13(input_ptr: [*]u8, length: usize) ?[*]u8 {
    // Create slice from pointer and length
    const input = input_ptr[0..length];

    // Allocate output buffer
    const output = allocator.alloc(u8, length) catch return null;

    // Process each character
    for (input, 0..) |char, i| {
        output[i] = rotateChar(char);
    }

    return output.ptr;
}
