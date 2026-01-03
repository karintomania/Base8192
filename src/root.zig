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

    const input = input_ptr[0..length];
    const encoded = base8192.encode(input, allocator) catch {
        return null;
    };

    const result = allocator.alloc(u8, encoded.len + 4) catch {
        return null;
    };

    std.mem.writeInt(u32, result[0..4], @intCast(encoded.len), .little);

    @memcpy(result[4..], encoded);

    allocator.free(encoded);

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

        // Encode the input
        const result_ptr = encode(input.ptr, input.len).?;
        const output_len = std.mem.readInt(u32, result_ptr[0..4], .little);

        const result = result_ptr[4..output_len+4];
        std.debug.print("output_len: {d}\n", .{output_len});
        std.debug.print("result: {s}\n", .{result});

        // Verify the encoding
        try std.testing.expectEqualSlices(u8, want, result);

        // Clean up - deallocate the memory
        deallocate(result_ptr, output_len);
    }
}
