const std = @import("std");
const base8192 = @import("base8192.zig");

// This outputs exactly the same result as self-encode.js, but using the js version because it uses the actual encoder to encode itself. Whereas this version will create a new excutabel to encode the encoder.
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();

    const cwd = std.fs.cwd();
    var read_buf: [128_000]u8 = undefined;

    const wasm_binary = try cwd.readFile("zig-out/bin/base8192.wasm", &read_buf);

    const result = try base8192.encode(wasm_binary, allocator);
    defer allocator.free(result);

    const encoded_js_path = try cwd.createFile("encoder.js", .{});

    const writer = encoded_js_path.writer();
    try writer.print("export const encoded = \"{s}\";", .{result});
}
