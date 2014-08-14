/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    COMMAND = 'check-file-coverage',
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

    /*
        Modifying `sample-project` can break these tests.

        If the tests start to fail, one can debug the discrepancies
        in the test assertions using `console.log(results.stdout());`
        inside each failing test.

        `check-file-coverage` logs the file name and file coverage for
        each file that does not meet the specified coverage thresholds.
    */

    "should fail with a single unmet negative coverage threshold ": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '--branches', '-1' ], function (results) {
            test.ok(!results.succeeded());
            test.done();
        });
    },
    "should fail with a single unmet positive coverage threshold ": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '--branches', '50' ], function (results) {
            test.ok(!results.succeeded());
            test.done();
        });
    },
    "should fail with a mix of met/unmet coverage thresholds": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '--lines', '40', '--branches', '-1' ], function (results) {
            test.ok(!results.succeeded());
            test.done();
        });
    },
    "should fail citing `bar.js` but not `dummy_vendor_lib.js`": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '--lines', '50' ], function (results) {
            test.ok(!results.succeeded());
            test.ok(results.grepOutput(/bar.js/));
            test.ok(!results.grepOutput(/dummy_vendor_lib.js/));
            test.done();
        });
    },
    "should fail citing `bar.js` and `dummy_vendor_lib.js`": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '--functions', '100' ], function (results) {
            test.ok(!results.succeeded());
            test.done();
        });
    },
    "should pass with a single met positive coverage threshold": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '--lines', '40' ], function (results) {
            test.ok(results.succeeded());
            test.done();
        });
    },
    "should pass with a single met negative coverage threshold": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '--statements', '-3' ], function (results) {
            test.ok(results.succeeded());
            test.done();
        });
    },
    "should pass with multiple met coverage thresholds": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '--lines', '40', '--statements', '-3'], function (results) {
            test.ok(results.succeeded());
            test.done();
        });
    },
    "should pass with no specified coverage thresholds": function(test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([], function(results) {
            test.ok(results.succeeded());
            test.done();
        });
    },
    "should pass with any threshold when no coverage found": function(test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run(['--statements', '100', '**/foobar.json'], function(results) {
            test.ok(results.succeeded());
            test.done();
        });
    }
};
