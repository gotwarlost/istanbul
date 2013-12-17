/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    existsSync = fs.existsSync || path.existsSync,
    vm = require('vm'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    INPUT_DIR_CC = path.join(__dirname, '../other/data-complete-copy/'),
    OUTPUT_DIR = path.resolve(process.cwd(), 'output'),
    COMMAND = 'instrument',
    DIR = path.resolve(__dirname, 'sample-project'),
    helper = require('../cli-helper'),
    existsSync = fs.existsSync || path.existsSync,
    run = helper.runCommand.bind(null, COMMAND),
    INPUT_DIR_JS_FILE_COUNT = 0;

fs.readdirSync(INPUT_DIR_CC).forEach(function(file) {
    var extenstion = path.extname(file);

    if (extenstion === '.js') {
        INPUT_DIR_JS_FILE_COUNT++;
    }
});

module.exports = {
    setUp: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        mkdirp.sync(OUTPUT_DIR);
        helper.resetOpts();
        cb();
    },
    tearDown: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        cb();
    },
    "should work with default options for a single file": function (test) {
        run([ 'lib/foo.js' ], function (results) {
            test.ok(results.succeeded());
            test.doesNotThrow(function () {
                vm.createScript(results.stdout().join('\n'), path.resolve(DIR, 'lib', 'foo.js'));
            }, "Invalid code generated; logging interference perhaps?");
            test.done();
        });
    },
    "should preserve comments in output": function (test) {
        run([ 'lib/foo.js', '--preserve-comments' ], function (results) {
            var code = results.stdout().join('\n');
            test.ok(results.succeeded());
            test.doesNotThrow(function () {
                vm.createScript(code, path.resolve(DIR, 'lib', 'foo.js'));
            }, "Invalid code generated; logging interference perhaps?");
            test.ok(code.match(/\/\/ export what we need/), 'Could not find comment that should have been preserved');
            test.done();
        });
    },
    "should work with compact as default": function (test) {
        run([ 'lib/foo.js' ], function (results) {
            test.ok(results.succeeded());
            var compact = results.stdout().join('\n');
            run([ 'lib/foo.js', '--no-compact' ], function (results2) {
                var full = results2.stdout().join('\n');
                test.ok(full.length > compact.length);
                test.done();
            });
        });
    },
    "should work with explicit output option for a single file": function (test) {
        run([ 'lib/foo.js', '--output', path.resolve(OUTPUT_DIR, 'foo.js') ], function (results) {
            test.ok(results.succeeded());
            test.doesNotThrow(function () {
                vm.createScript(fs.readFileSync(path.resolve(OUTPUT_DIR, 'foo.js'), 'utf8'), path.resolve(DIR, 'lib', 'foo.js'));
            }, "Invalid code generated; logging interference perhaps?");
            test.done();
        });
    },
    "should instrument multiple files": function (test) {
        run([ 'lib', '--output', OUTPUT_DIR, '-v' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'foo.js')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'bar.js')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'util', 'generate-names.js')));
            test.equal(fs.readFileSync(path.resolve(DIR, 'lib', 'util', 'bad.js'), 'utf8'),
                fs.readFileSync(path.resolve(OUTPUT_DIR, 'util', 'bad.js'), 'utf8'));
            test.ok(results.grepOutput(/Processed: foo\.js/));
            test.ok(results.grepOutput(/Processed \[\d+\] files in/));
            test.ok(results.grepOutput(/The following 1 file\(s\) had errors and were copied as-is/));
            test.done();
        });
    },
    "should instrument multiple files without errors": function (test) {
        run([ 'lib', '--output', OUTPUT_DIR, '-x', '**/bad.js' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'foo.js')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'bar.js')));
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'util', 'bad.js')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'util', 'generate-names.js')));
            test.ok(!results.grepOutput(/Processed: foo\.js/));
            test.ok(results.grepOutput(/Processed \[\d+\] files in/));
            test.ok(!results.grepOutput(/The following 1 file\(s\) had errors and were copied as-is/));
            test.done();
        });
    },
    "should save baseline coverage when requested": function (test) {
        var covFile = path.resolve(OUTPUT_DIR, 'cov.json');
        run([ 'lib/foo.js', '--save-baseline', '--baseline-file=' + covFile ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(covFile));
            test.ok(results.grepOutput(/Saving baseline coverage at/));
            test.done();
        });
    },
    "should barf on no args": function (test) {
        run([], function (results) {
            test.ok(!results.succeeded());
            test.ok(results.grepError(/Need exactly one filename\/ dirname argument/));
            test.done();
        });
    },
    "should barf on directory coverage when output option is not provided": function (test) {
        run([ 'lib'], function (results) {
            test.ok(!results.succeeded());
            test.ok(results.grepError(/Need an output directory/));
            test.done();
        });
    },
    "should barf on directory coverage when output === input": function (test) {
        run([ 'lib', '--output', 'lib'], function (results) {
            test.ok(!results.succeeded());
            test.ok(results.grepError(/Cannot instrument into the same directory/));
            test.done();
        });
    },
    "should not copy non js files when using no-complete-copy": function(test) {
        var inputFileCount;

        inputFileCount = fs.readdirSync(INPUT_DIR_CC).length;

        test.equal(fs.readdirSync(INPUT_DIR_CC).length, 6);
        test.equal(fs.readdirSync(OUTPUT_DIR).length, 0);

        run([ INPUT_DIR_CC, '--output', OUTPUT_DIR, '--no-complete-copy'], function (results) {
            test.ok(results.succeeded());
            test.equal(fs.readdirSync(OUTPUT_DIR).length, INPUT_DIR_JS_FILE_COUNT);
            test.done();
        });
    },
    "should not copy non js files when not specifying complete-copy": function(test) {
        // Backward compatibility test
        var inputFileCount;

        inputFileCount = fs.readdirSync(INPUT_DIR_CC).length;

        test.equal(fs.readdirSync(INPUT_DIR_CC).length, 6);
        test.equal(fs.readdirSync(OUTPUT_DIR).length, 0);

        run([ INPUT_DIR_CC, '--output', OUTPUT_DIR], function (results) {
            test.ok(results.succeeded());
            test.equal(fs.readdirSync(OUTPUT_DIR).length, INPUT_DIR_JS_FILE_COUNT);
            test.done();
        });
    },
    "should copy non js files when using complete-copy": function(test) {
        var inputFileCount;

        inputFileCount = fs.readdirSync(INPUT_DIR_CC).length;

        test.equal(fs.readdirSync(INPUT_DIR_CC).length, 6);
        test.equal(fs.readdirSync(OUTPUT_DIR).length, 0);

        run([ INPUT_DIR_CC, '--output', OUTPUT_DIR, '--complete-copy'], function (results) {
            test.ok(results.succeeded());
            test.equal(fs.readdirSync(OUTPUT_DIR).length, inputFileCount);
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'subdir', 'x.css')));
            test.done();
        });
    }
};

