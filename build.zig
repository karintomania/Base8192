const std = @import("std");

// mimic the command below:
// zig build-exe root.zig -target wasm32-freestanding -fno-entry --export=add;
pub fn build(b: *std.Build) void {
    const exe = b.addExecutable(.{
        .name = "base8192",
        .root_source_file = b.path("src/root.zig"),
        .target = b.resolveTargetQuery(.{
            .cpu_arch = .wasm32,
            .os_tag = .freestanding,
        }),
        .optimize = .ReleaseSmall,
    });

    exe.entry = .disabled;
    exe.rdynamic = true;

    b.installArtifact(exe);

    // Add test step
    const unit_tests = b.addTest(.{
        .root_source_file = b.path("src/root.zig"),
    });

    const run_unit_tests = b.addRunArtifact(unit_tests);

    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&run_unit_tests.step);
}
