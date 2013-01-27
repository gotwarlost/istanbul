/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    COMMAND = 'report',
    COVER_COMMAND = 'cover',
    DIR = path.resolve(__dirname, 'sample-project'),
    OUTPUT_DIR = path.resolve(DIR, 'coverage'),
    helper = require('../cli-helper'),
    existsSync = fs.existsSync || path.existsSync,
    run = helper.runCommand.bind(null, COMMAND),
    runCover = helper.runCommand.bind(null, COVER_COMMAND);

module.exports = {
    setUp: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        mkdirp.sync(OUTPUT_DIR);
        helper.resetOpts();
        runCover([ 'test/run.js', '--report', 'none' ], function (/* results */) {
            cb();
        });
    },
    tearDown: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        cb();
    },
    "should run reports consuming coverage file with lcov default": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(fs.readFileSync(path.resolve(OUTPUT_DIR, 'lcov.info'), 'utf8') !== '');
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.done();
        });
    },
    "should run reports with specific format": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run(['--report', 'html'], function (results) {
            test.ok(results.succeeded());
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'index.html')));
            test.done();
        });
    },
    "should barf on invalid format": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '--report', 'gcov' ], function (results) {
            test.ok(!results.succeeded());
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(results.grepError(/Invalid report format/));
            test.done();
        });
    },
    "should respect input pattern": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '--report', 'lcovonly', '**/foobar.json' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.equal('', fs.readFileSync(path.resolve(OUTPUT_DIR, 'lcov.info'), 'utf8'));
            test.done();
        });
    }
};