const std = @import("std");

// mimic the command below:
// zig build-exe root.zig -target wasm32-freestanding -fno-entry --export=add;
pub fn build(b: *std.Build) void {
    const optimize = b.standardOptimizeOption(.{});

    const exe = b.addExecutable(.{
        .name = "base8192",
        .root_source_file = b.path("src/root.zig"),
        .target = b.resolveTargetQuery(.{
            .cpu_arch = .wasm32,
            .os_tag = .freestanding,
        }),
        .optimize = optimize,
    });

    exe.entry = .disabled;
    exe.rdynamic = true;

    b.installArtifact(exe);
    const add_install = b.addInstallArtifact(exe, .{});

    // Add test step
    const unit_tests = b.addTest(.{
        .root_source_file = b.path("src/root.zig"),
        .target = b.graph.host,
    });

    const run_unit_tests = b.addRunArtifact(unit_tests);

    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&run_unit_tests.step);

    // add generate js step
    const gen_js = b.addExecutable(.{
        .name = "gen_js",
        .root_source_file = b.path("src/gen_js.zig"),
        .target = b.graph.host,
        .optimize = .Debug,
    });

    const run_gen_js = b.addRunArtifact(gen_js);
    const gen_js_step = b.step("gen_js", "Generate base8192 encoded binary of the encoder in js file.");
    gen_js_step.dependOn(&run_gen_js.step);
    gen_js_step.dependOn(&add_install.step);
}
