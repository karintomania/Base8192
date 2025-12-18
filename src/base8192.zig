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

// Show unknown string for decode error
const replacement = []const u8{ 0xEF, 0xBF, 0xBD };

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

    pub fn initFromUnicodePoint(codePoint: u21, tbType: TwelveBitsType) !TwelveBits {
        var bits: u12 = undefined;
        switch (tbType) {
            .left => {
                if (codePoint < baseCodePointLeft or (baseCodePointLeft + 0xFFF) < codePoint) {
                    return error.InvalidCodePoint;
                }
                bits = @truncate(codePoint - baseCodePointLeft);
            },
            .right => {
                if (codePoint < baseCodePointRight or (baseCodePointRight + 0xFFF) < codePoint) {
                    return error.InvalidCodePoint;
                }
                bits = @truncate(codePoint - baseCodePointRight);
            },
            .padding => {
                if (codePoint != paddingCodepoint) return error.InvalidCodePoint;
                bits = 0;
            },
        }

        return TwelveBits{ .bits = bits, .type = tbType };
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

    pub fn initFromCodePoints(leftCodePoint: u21, rightCodePoint: ?u21, paddingCodePointArg: ?u21) !TwelveBitsPair {
        const leftTwelveBit = try TwelveBits.initFromUnicodePoint(leftCodePoint, .left);

        const rightTwelveBit = if (rightCodePoint != null)
            try TwelveBits.initFromUnicodePoint(rightCodePoint.?, .right)
        else
            null;

        const paddingTwelveBit =
            if (paddingCodePointArg != null)
                try TwelveBits.initFromUnicodePoint(paddingCodePointArg.?, .padding)
            else
                null;

        return TwelveBitsPair{ .left = leftTwelveBit, .right = rightTwelveBit, .padding = paddingTwelveBit };
    }

    fn getFixedLengthArray(str: []const u8, allocator: Allocator) ![3]u8 {
        if (str.len != 3) return error.InvalidSliceLength;

        const ary = allocator.alloc(u8, 3);

        @memcpy(ary, str.ptr);

        return ary.*;
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

    pub fn toBytes(tbp: *const TwelveBitsPair, out: *[3]u8) u8 {
        out[0] = @truncate(tbp.left.bits >> 4);

        if (tbp.right) |right| {
            out[1] = @truncate(((tbp.left.bits & 0x00F) << 4) | right.bits >> 8);

            if (tbp.padding != null) {
                // 2 bytes
                return 2;
            } else {
                // 3 bytes
                out[2] = @truncate(right.bits);
                // 2 bytes
                return 3;
            }
        }

        if (tbp.padding != null) {
            return 1;
        }

        @panic("the code shouldn't reach here");
    }
};

pub fn encode(input: []const u8, allocator: Allocator) ![]u8 {
    var i: usize = 0;
    var arena_state = std.heap.ArenaAllocator.init(allocator);
    defer arena_state.deinit();
    const arena = arena_state.allocator();

    var result = std.ArrayList(u8).init(allocator);

    while (i + 2 < input.len) {
        const twelveBitsPair = try TwelveBitsPair.initFromBytes(input[i .. i + 3]);
        const str = try twelveBitsPair.toEncodedUtf8String(arena);

        try result.appendSlice(str);
        i += 3;
    }

    if (input.len - i != 0) {
        const remainder = input.len - i;
        const twelveBitsPair = try TwelveBitsPair.initFromBytes(input[i .. i + remainder]);
        const str = try twelveBitsPair.toEncodedUtf8String(arena);

        try result.appendSlice(str);
    }

    return result.toOwnedSlice();
}

const decodeResult = struct {
    result: []u8,
    errors: []u64,
};

pub fn decode(input: []const u8, allocator: Allocator) !decodeResult {
    var i: usize = 0;

    var result = std.ArrayList(u8).init(allocator);
    var errors = std.ArrayList(u64).init(allocator);

    defer result.deinit();
    defer errors.deinit();

    var utf8View = try unicode.Utf8View.init(input);
    var it = utf8View.iterator();

    var bytes: [3]u8 = undefined;

    var codepoints = std.ArrayList(u21).init(allocator);
    defer codepoints.deinit();

    while (it.nextCodepoint()) |codepoint| {
        try codepoints.append(codepoint);
    }

    const hasPadding = codepoints.getLast() == paddingCodepoint;

    while (i < codepoints.items.len - 1) {
        const unhandledCodepoints = codepoints.items.len - i;
        const first: u21 = codepoints.items[i];
        var second: ?u21 = null;
        var padding: ?u21 = null;
        var consumed: usize = 0;

        if (unhandledCodepoints == 3 and hasPadding) {
            second = codepoints.items[i + 1];
            padding = paddingCodepoint;
            consumed = 3;
        } else if (unhandledCodepoints == 2 and hasPadding) {
            padding = paddingCodepoint;
            consumed = 2;
        } else {
            second = codepoints.items[i + 1];
            consumed = 2;
        }

        const twelveBitsPair = TwelveBitsPair.initFromCodePoints(first, second, padding) catch {
            // record the error position
            try errors.append(i);
            i += 1;
            continue;
        };

        const n = twelveBitsPair.toBytes(&bytes);
        try result.appendSlice(bytes[0..n]);

        i += consumed;
    }

    return decodeResult{ .result = try result.toOwnedSlice(), .errors = try errors.toOwnedSlice() };
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

test "decode returns expected result" {
    const allocator = std.testing.allocator;

    const TestCase = struct {
        input: []const u8,
        want: []const u8,
    };

    const test_cases = [_]TestCase{
        .{ .input = "吖恣", .want = "abc" },
        .{ .input = "吖恣呀等", .want = "abcd" },
        .{ .input = "吖恣呆挀等", .want = "abcde" },
        .{ .input = "屋榊屩斥尸徯尸庁刦彳呓昱冓惰培枏", .want = "今日は、Base8192🙏" },
    };

    for (test_cases) |t| {
        const got = try decode(t.input, allocator);
        defer allocator.free(got.result);
        defer allocator.free(got.errors);
        try std.testing.expectEqualStrings(t.want, got.result);
        try std.testing.expectEqual(0, got.errors.len);
    }
}

test "decode handles errors" {
    const allocator = std.testing.allocator;

    const TestCase = struct {
        input: []const u8,
        result: []const u8,
        errors: []const u64,
    };

    const test_cases = [_]TestCase{
        .{
            .input = "吖恣吖吖恣",
            .result = "abcabc",
            .errors = &[_]u64{2},
        },
        .{
            .input = "屋榊屩斥%尸徯%尸庁刦彳呓昱冓惰培枏",
            .result = "今日は、Base8192🙏",
            .errors = &[_]u64{ 4, 7 },
        },
    };

    for (test_cases) |t| {
        const got = try decode(t.input, allocator);
        defer allocator.free(got.result);
        defer allocator.free(got.errors);
        try std.testing.expectEqualStrings(t.result, got.result);
        try std.testing.expectEqualSlices(u64, t.errors, got.errors);
    }
}

test "TwelveBits toUtf8Sequence" {
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

test "TwelveBits initFromUnicodePoint" {
    const test_cases = [_]struct {
        letter: []const u8,
        tbType: TwelveBitsType,
        want: u12,
    }{
        .{ .letter = "一", .tbType = .left, .want = 0 },
        .{ .letter = "丁", .tbType = .left, .want = 1 },
        .{ .letter = "巿", .tbType = .left, .want = 0xFFF },
        .{ .letter = "帀", .tbType = .right, .want = 0 },
        .{ .letter = "币", .tbType = .right, .want = 1 },
        .{ .letter = "淿", .tbType = .right, .want = 0xFFF },
        .{ .letter = "等", .tbType = .padding, .want = 0 },
    };

    for (test_cases) |test_case| {
        const codePoint = try std.unicode.utf8Decode3(test_case.letter[0..3].*);
        const tb = try TwelveBits.initFromUnicodePoint(codePoint, test_case.tbType);

        try std.testing.expectEqual(test_case.want, tb.bits);
    }
}

test "TwelveBitsPair initFromBytes" {
    const allocator = std.testing.allocator;

    const TestCase = struct {
        bytes: []const u8,
        expected: []const u8,
    };

    const test_cases = [_]TestCase{
        .{ .bytes = &[_]u8{ 0x00, 0x0F, 0xFF }, .expected = "一淿" },
        .{ .bytes = &[_]u8{ 0x61, 0x62, 0x63 }, .expected = "吖恣" },
        .{ .bytes = &[_]u8{0x00}, .expected = "一等" },
        .{ .bytes = &[_]u8{ 0x00, 0x61 }, .expected = "丆开等" },
    };

    for (test_cases) |test_case| {
        const bytes = test_case.bytes;

        const tbp = try TwelveBitsPair.initFromBytes(bytes);

        const result = try tbp.toEncodedUtf8String(allocator);
        defer allocator.free(result);

        try std.testing.expectEqualStrings(test_case.expected, result);
    }
}

test "TwelveBitsPair initFromEncodedStringInUtf8" {
    const TestCase = struct {
        str: []const u8,
        wantLeft: u12,
        wantRight: ?u12,
        wantPadding: ?u12,
    };

    const test_cases = [_]TestCase{
        .{ .str = "一淿", .wantLeft = 0x000, .wantRight = 0xFFF, .wantPadding = null },
        .{ .str = "一淿", .wantLeft = 0x000, .wantRight = 0x0FFF, .wantPadding = null },
        .{ .str = "吖恣", .wantLeft = 0x616, .wantRight = 0x263, .wantPadding = null },
        .{ .str = "一等", .wantLeft = 0x000, .wantRight = null, .wantPadding = 0 },
        .{ .str = "丆开等", .wantLeft = 0x006, .wantRight = 0x100, .wantPadding = 0 },
    };

    for (test_cases) |t| {
        var it = (try unicode.Utf8View.init(t.str)).iterator();
        const first = it.nextCodepoint().?;
        const second = it.nextCodepoint().?;
        const third = it.nextCodepoint() orelse null;

        const result =
            if (second == paddingCodepoint) // if the second is padding
                try TwelveBitsPair.initFromCodePoints(first, null, second)
            else
                try TwelveBitsPair.initFromCodePoints(first, second, third);

        try std.testing.expectEqual(t.wantLeft, result.left.bits);
        if (t.wantRight) |wantRight| {
            try std.testing.expectEqual(wantRight, result.right.?.bits);
        } else {
            try std.testing.expectEqual(null, result.right);
        }
    }
}

test "TwelveBitsPair toByteSlice" {
    // const allocator = std.testing.allocator;
    const TestCase = struct {
        want: []const u8,
    };

    const test_cases = [_]TestCase{
        .{ .want = &.{ 0x01, 0x23, 0x45 } },
        .{ .want = &.{ 0x01, 0x23 } },
        .{ .want = &.{0x01} },
    };

    for (test_cases) |t| {
        var result: [3]u8 = undefined;
        const tb = try TwelveBitsPair.initFromBytes(t.want);

        const n = tb.toBytes(&result);

        try std.testing.expectEqual(t.want.len, n);

        for (0..t.want.len) |i| {
            try std.testing.expectEqual(t.want[i], result[i]);
        }
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
