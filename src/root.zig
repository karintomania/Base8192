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

pub export fn encode(input_ptr: [*]const u8, length: usize) ?[*]u8 {
    // Create slice from pointer and length
    const input = input_ptr[0..length];

    const result = base8192.encode(input, allocator) catch return null;

    // Allocate output buffer
    const output = allocator.alloc(u8, result.len) catch return null;

    @memcpy(output, result);

    return output.ptr;
}

test "encode" {
    const input = "abc";

    const result = encode(input.ptr, input.len).?;

    try std.testing.expectEqualStrings("吖恣", result[0..6]);
}
