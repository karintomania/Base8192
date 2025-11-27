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

pub fn rotateChar(c: u8) u8 {
    return switch (c) {
        'A'...'M' => c + 13,
        'N'...'Z' => c - 13,
        'a'...'m' => c + 13,
        'n'...'z' => c - 13,
        else => c,
    };
}

pub fn encode(input: []const u8) []const u8 {
    return input;
}

test "encode returns expected result" {
    const input = "test";
    const result = encode(input);
    try std.testing.expectEqualStrings("test", result);
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
