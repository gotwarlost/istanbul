/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    vm = require('vm'),
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
    }
};