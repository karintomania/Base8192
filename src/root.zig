const std = @import("std");
const builtin = @import("builtin");
const base8192 = @import("base8192.zig");

// Use the WebAssembly-specific allocator for freestanding target
const allocator = if (builtin.cpu.arch == .wasm32)
    std.heap.wasm_allocator
else
    std.heap.page_allocator;

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

/// Calculate the output length for Base8192 encoding
pub export fn getEncodedLength(input_length: usize) usize {
    const full_chunks = input_length / 3;
    const remainder = input_length % 3;

    const padding_bytes: usize = if (remainder == 0)
        0
    else if (remainder == 1)
        6
    else
        9;

    return full_chunks * 6 + padding_bytes;
}

pub export fn encode(input_ptr: [*]const u8, length: usize) ?[*]u8 {
    const input = input_ptr[0..length];

    const result = base8192.encode(input, allocator) catch return null;

    return result.ptr;
}

test "encode" {
    const test_cases = [_]struct { []const u8, []const u8 }{
        .{ "abc", "吖恣" },
        .{ "abcd", "吖恣呀等" },
        .{ "abcde", "吖恣呆挀等" },
    };
    for (test_cases) |test_case| {
        const input, const want = test_case;

        // Get the expected output length
        const output_len = getEncodedLength(input.len);

        // Encode the input
        const result_ptr = encode(input.ptr, input.len).?;
        const result = result_ptr[0..output_len];

        // Verify the encoding
        try std.testing.expectEqualStrings(want, result);

        // Clean up - deallocate the memory
        deallocate(result_ptr, output_len);
    }
}

test "getEncodedLength" {
    try std.testing.expectEqual(@as(usize, 6), getEncodedLength(3));

    try std.testing.expectEqual(@as(usize, 12), getEncodedLength(4));

    try std.testing.expectEqual(@as(usize, 15), getEncodedLength(5));
}
