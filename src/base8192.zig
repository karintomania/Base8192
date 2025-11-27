const std = @import("std");
const unicode = std.unicode;
const Allocator = std.mem.Allocator;

// "一":U+4E00
const baseCodePointLeft: u21 = 0x4E00;
// "帀":U+5E00
const baseCodePointRight: u21 = 0x5E00;

// use 等:U+7B49 for padding.
// 等 means equal, btw.
const paddingCodepoint: u21 = 0x7B49;
const paddingString = "等";

const TwelveBitsType = enum {
    left,
    right,
    padding,
};

const TwelveBits = struct {
    bits: u12,
    type: TwelveBitsType,

    pub fn init(bits: u12, tbType: TwelveBitsType) TwelveBits {
        return TwelveBits{ .bits = if (tbType == .padding) 0 else bits, .type = tbType };
    }

    pub fn toUtf8Sequence(tb: *const TwelveBits, allocator: Allocator) ![]u8 {
        const codepoint = switch (tb.type) {
            .left => baseCodePointLeft + tb.bits,
            .right => baseCodePointRight + tb.bits,
            .padding => paddingCodepoint,
        };

        const utf8Sequence = try allocator.alloc(u8, 3);
        _ = try unicode.utf8Encode(codepoint, utf8Sequence);
        return utf8Sequence;
    }
};

const TwelveBitsPair = struct {
    left: TwelveBits,
    right: ?TwelveBits,
    padding: ?TwelveBits,

    pub fn initFromBytes(bytes: []const u8) error{InvalidSliceLength}!TwelveBitsPair {
        // TODO: length check of bytes
        if (bytes.len < 1 or bytes.len > 3) return error.InvalidSliceLength;

        switch (bytes.len) {
            1 => {
                const leftBits: u12 = (@as(u12, bytes[0]) << 4);

                return TwelveBitsPair{
                    .left = TwelveBits.init(leftBits, .left),
                    .right = null,
                    .padding = TwelveBits.init(0, .padding),
                };
            },
            2 => {
                const leftBits: u12 = (@as(u12, bytes[0]) << 4) | (@as(u12, bytes[1]) >> 4);
                const rightBits: u12 = (@as(u12, bytes[1] & 0b00001111) << 8);

                return TwelveBitsPair{
                    .left = TwelveBits.init(leftBits, .left),
                    .right = TwelveBits.init(rightBits, .right),
                    .padding = TwelveBits.init(0, .padding),
                };
            },
            3 => {
                const leftBits: u12 = (@as(u12, bytes[0]) << 4) | (@as(u12, bytes[1]) >> 4);
                const rightBits: u12 = (@as(u12, bytes[1] & 0b00001111) << 8) | @as(u12, bytes[2]);

                return TwelveBitsPair{
                    .left = TwelveBits.init(leftBits, .left),
                    .right = TwelveBits.init(rightBits, .right),
                    .padding = null,
                };
            },
            else => unreachable,
        }
    }

    pub fn toEncodedUtf8String(tbp: *const TwelveBitsPair, allocator: Allocator) ![]u8 {
        var sequences = std.ArrayList([]const u8).init(allocator);
        defer sequences.deinit();

        const leftSeq = try tbp.left.toUtf8Sequence(allocator);
        defer allocator.free(leftSeq);
        try sequences.append(leftSeq);

        var rightSeq: ?[]u8 = null;
        if (tbp.right) |right| {
            rightSeq = try right.toUtf8Sequence(allocator);
            try sequences.append(rightSeq.?);
        }
        defer if (rightSeq) |seq| allocator.free(seq);

        var paddingSeq: ?[]u8 = null;
        if (tbp.padding) |padding| {
            paddingSeq = try padding.toUtf8Sequence(allocator);
            try sequences.append(paddingSeq.?);
        }
        defer if (paddingSeq) |seq| allocator.free(seq);

        const result = try std.mem.concat(
            allocator,
            u8,
            sequences.items,
        );

        return result;
    }
};

pub fn rotateChar(c: u8) u8 {
    return switch (c) {
        'A'...'M' => c + 13,
        'N'...'Z' => c - 13,
        'a'...'m' => c + 13,
        'n'...'z' => c - 13,
        else => c,
    };
}

pub fn encode(input: []const u8, allocator: Allocator) ![]const u8 {
    var i: usize = 0;
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();
    const arena_allocator = arena.allocator();

    var seq = std.ArrayList(u8).init(allocator);

    while (i+2 < input.len) {
        const twelveBitsPair = try TwelveBitsPair.initFromBytes(input[i..i+3]);
        const str = try twelveBitsPair.toEncodedUtf8String(arena_allocator);

        try seq.appendSlice(str);
        i += 3;
    }

    if (input.len - i != 0) {
        const remainder = input.len - i;
        const twelveBitsPair = try TwelveBitsPair.initFromBytes(input[i..i+remainder]);
        const str = try twelveBitsPair.toEncodedUtf8String(arena_allocator);

        try seq.appendSlice(str);
    }

    return seq.toOwnedSlice();
}

test "encode returns expected result" {
    const allocator = std.testing.allocator;

    const TestCase = struct {
        input: []const u8,
        want: []const u8,
    };

    const test_cases = [_]TestCase{
        .{ .input = "abc", .want = "吖恣" },
        .{ .input = "abcd", .want = "吖恣呀等" },
        .{ .input = "abcde", .want = "吖恣呆挀等" },
        .{ .input = "今日は、Base8192🙏", .want = "屋榊屩斥尸徯尸庁刦彳呓昱冓惰培枏" },
    };

    for (test_cases) |test_case| {
        const got = try encode(test_case.input, allocator);
        defer allocator.free(got);
        try std.testing.expectEqualStrings(test_case.want, got);
    }
}

test "TwelveBits" {
    const allocator = std.testing.allocator;

    const TestCase = struct {
        bits: u12,
        tbType: TwelveBitsType,
        want: []const u8,
    };

    const test_cases = [_]TestCase{
        .{ .bits = 0, .tbType = .left, .want = "一" },
        .{ .bits = 1, .tbType = .left, .want = "丁" },
        .{ .bits = 0xFFF, .tbType = .left, .want = "巿" },
        .{ .bits = 0, .tbType = .right, .want = "帀" },
        .{ .bits = 1, .tbType = .right, .want = "币" },
        .{ .bits = 0xFFF, .tbType = .right, .want = "淿" },
        .{ .bits = 0, .tbType = .padding, .want = "等" },
    };

    for (test_cases) |test_case| {
        const tb = TwelveBits.init(test_case.bits, test_case.tbType);
        try std.testing.expectEqual(test_case.bits, tb.bits);
        try std.testing.expectEqual(test_case.tbType, tb.type);

        const got = try tb.toUtf8Sequence(allocator);
        defer allocator.free(got);

        try std.testing.expectEqualStrings(test_case.want, got);
    }
}

test "TwelveBitsPair" {
    const allocator = std.testing.allocator;

    const TestCase = struct {
        bytes: []const u8,
        expected: []const u8,
    };

    const test_cases = [_]TestCase{
        .{.bytes = &[_]u8{ 0x00, 0x0F, 0xFF }, .expected = "一淿"},
        .{.bytes = &[_]u8{ 0x61, 0x62, 0x63 }, .expected = "吖恣"},
        .{.bytes = &[_]u8{ 0x00 }, .expected = "一等"},
        .{.bytes = &[_]u8{ 0x00, 0x61 }, .expected = "丆开等"},
    };

    for (test_cases) |test_case| {
        const bytes = test_case.bytes;

        const tbp = try TwelveBitsPair.initFromBytes(bytes);

        const result = try tbp.toEncodedUtf8String(allocator);
        defer allocator.free(result);

        try std.testing.expectEqualStrings(test_case.expected, result);
    }
}

test "learn utf8 view" {
    var it = (try unicode.Utf8View.init("東京都")).iterator();

    const first = it.nextCodepoint().?;

    try std.testing.expectEqual(0x6771, first);
}

// test "testUtf8Encode" {
//     // A few taken from wikipedia a few taken elsewhere
//     var array: [4]u8 = undefined;
//     try std.testing.expectEqual((try unicode.utf8Encode(0x4E01, array[0..])), 3);

//     std.debug.print("{s}", .{array[0..]});
//     try std.testing.expectEqualStrings("丁", array[0..3]);
// }
