const std = @import("std");
const base8192 = @import("base8192.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();

    const cwd = std.fs.cwd();
    var read_buf: [16384]u8 = undefined;

    const wasm_binary = try cwd.readFile("zig-out/bin/base8192.wasm", &read_buf);

    const result = try base8192.encode(wasm_binary, allocator);
    defer allocator.free(result);

    const encoded_js_path = try cwd.createFile("encoder.js", .{});

    const writer = encoded_js_path.writer();
    try writer.print("export const encoded = \"{s}\";", .{result});
}
