/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    COMMAND = 'cover',
    DIR = path.resolve(__dirname, 'sample-project'),
    OUTPUT_DIR = path.resolve(DIR, 'coverage'),
    helper = require('../cli-helper'),
    existsSync = fs.existsSync || path.existsSync,
    run = helper.runCommand.bind(null, COMMAND);

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
    "should cover tests as expected": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-v' ], function (results) {
            test.ok(results.succeeded());
            test.ok(results.grepError(/Module load hook:/));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.json'), 'utf8')),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/foo/) || k.match(/bar/); });
            test.ok(filtered.length === 2);
            test.done();
        });
    },
    "should cover tests as expected without extra noise and not covering excluded files": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-x', '**/foo.js' ], function (results) {
            test.ok(results.succeeded());
            test.ok(!results.grepError(/Module load hook:/));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.json'), 'utf8')),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/foo/); });
            test.ok(filtered.length === 0);
            test.done();
        });
    },
    "should skip reporting when requested": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '--report', 'none', '--print', 'detail' ], function (results) {
            test.ok(results.succeeded());
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            test.done();
        });
    },
    "should use non-default report format when requested": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '--report', 'lcovonly' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            test.done();
        });
    },
    "should cover nothing when everything excluded": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-x', '**/*.js' ], function (results) {
            test.ok(results.succeeded());
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            test.done();
        });
    },
    "should cover everything under the sun when default excludes are suppressed": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '--no-default-exclude' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.json'), 'utf8')),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/node_modules/); });
            test.ok(filtered.length === 1);
            test.done();
        });
    },
    "should barf when no file is provided": function (test) {
        run([], function (results) {
            test.ok(!results.succeeded());
            test.ok(results.grepError(/Need a filename argument for the cover command/));
            test.done();
        });
    },
    "should barf on invalid command": function (test) {
        run([ 'foobar' ], function (results) {
            test.ok(!results.succeeded());
            test.ok(results.grepError(/Unable to resolve file/));
            test.done();
        });
    },
    "should work with RequireJS and AMD modules": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/amd-run.js', '-v', '--hook-run-in-context' ], function (results) {
            test.ok(results.succeeded());
            test.ok(results.grepError(/Module load hook:/));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.json'), 'utf8')),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/amd\/lorem/) || k.match(/amd\/ipsum/); });
            test.ok(filtered.length === 2);
            test.ok(filtered.length === Object.keys(coverage).length);
            test.done();
        });
    },
    "should apply post-require-hook correctly when absolute path specified": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-v', '-x', '**/foo.js', '--post-require-hook', 'node_modules/post-require/hook.js' ], function (results) {
            test.ok(results.succeeded());
            test.ok(results.grepError(/PRH: MatchFn was a function/));
            test.ok(results.grepError(/PRH: TransformFn was a function/));
            test.ok(results.grepError(/PRH: Verbose was true/));
            //yes, post require hook must be called always even when a file is not covered
            test.ok(results.grepError(/PRH: Saw foo\.js/));
            //and, of course, for covered files as well
            test.ok(results.grepError(/PRH: Saw bar\.js/));
            test.done();
        });
    },
    "should apply post-require-hook correctly when module name specified": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-v', '-x', '**/foo.js', '--post-require-hook', 'post-require' ], function (results) {
            test.ok(results.succeeded());
            test.ok(results.grepError(/PRH: MatchFn was a function/));
            test.ok(results.grepError(/PRH: TransformFn was a function/));
            test.ok(results.grepError(/PRH: Verbose was true/));
            //yes, post require hook must be called always even when a file is not covered
            test.ok(results.grepError(/PRH: Saw foo\.js/));
            //and, of course, for covered files as well
            test.ok(results.grepError(/PRH: Saw bar\.js/));
            test.done();
        });
    },
    "should barf when  post-require-hook not available": function (test) {
        run([ 'test/run.js', '-v', '-x', '**/foo.js', '--post-require-hook', 'does-not-exist' ], function (results) {
            test.ok(!results.succeeded());
            test.ok(results.grepError(/Unable to resolve \[does-not-exist\] as a node module/));
            test.done();
        });
    },
    "should not introduce globals in the middle of running a test": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/global-leak.js', '-v' ], function (results) {
            test.ok(results.succeeded());
            test.done();
        });
    }
};
