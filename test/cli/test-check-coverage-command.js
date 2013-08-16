/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    testCase  = require('nodeunit').testCase,
    COMMAND = 'check-coverage',
    COVER_COMMAND = 'cover',
    DIR = path.resolve(__dirname, 'sample-project'),
    OUTPUT_DIR = path.resolve(DIR, 'coverage'),
    helper = require('../cli-helper'),
    existsSync = fs.existsSync || path.existsSync,
    run = helper.runCommand.bind(null, COMMAND),
    runCover = helper.runCommand.bind(null, COVER_COMMAND);

module.exports = testCase({
    setUp: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        mkdirp.sync(OUTPUT_DIR);
        helper.resetOpts();
        runCover([ 'test/run.js', '--report', 'none' ], function () {
            cb();
        });
    },
    tearDown: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        cb();
    },
    "Combined coverage": testCase({
        "should fail on inadequate statement coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for statements/));
                test.done();
            });
        },
        "should fail on inadequate branch coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--branches', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for branches/));
                test.done();
            });
        },
        "should fail on inadequate function coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--functions', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for functions/));
                test.done();
            });
        },
        "should fail on inadequate line coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--lines', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for lines/));
                test.done();
            });
        },
        "should fail with multiple reasons when multiple thresholds violated": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements=72', '--functions=50', '--branches=72', '--lines=72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for lines/));
                test.ok(results.grepError(/Coverage for statements/));
                test.ok(results.grepError(/Coverage for branches/));
                test.ok(!results.grepError(/Coverage for functions/));
                test.done();
            });
        },
        "should fail with multiple reasons when multiple thresholds violated with negative thresholds": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements=-3', '--functions=-10', '--branches=-1', '--lines=-3' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Uncovered count for lines/));
                test.ok(results.grepError(/Uncovered count for statements/));
                test.ok(results.grepError(/Uncovered count for branches/));
                test.ok(!results.grepError(/Uncovered count for functions/));
                test.done();
            });
        },
        "should pass with multiple reasons when all thresholds in check": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements=60', '--functions=50', '--branches=50', '--lines=60', '-v' ], function (results) {
                test.ok(results.succeeded());
                test.ok(!results.grepOutput(/\\"actuals\\"/), "Verbose message not printed as expected");
                test.done();
            });
        },
        "should succeed with any threshold when no coverage found": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements', '72', '**/foobar.json' ], function (results) {
                test.ok(results.succeeded());
                test.done();
            });
        }
    }),

    "Individual file coverage": testCase({
        "should fail on inadequate statement coverage ": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--file_statements', '50' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/File Coverage for statements/));
                test.ok(results.grepError(/bar\.js/));
                test.ok(!results.grepError(/foo\.js/));
                test.done();
            });
        },
        "should fail on inadequate branch coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--file_branches', '50' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/File Coverage for branches/));
                test.ok(results.grepError(/bar\.js/));
                test.ok(!results.grepError(/foo\.js/));
                test.done();
            });
        },
        "should fail on inadequate function coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--file_functions', '50' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/File Coverage for functions/));
                test.ok(results.grepError(/bar\.js/));
                test.ok(!results.grepError(/foo\.js/));
                test.done();
            });
        },
        "should fail on inadequate line coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--file_lines', '50' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/File Coverage for lines/));
                test.ok(results.grepError(/bar\.js/));
                test.ok(!results.grepError(/foo\.js/));
                test.done();
            });
        },
        "should fail with multiple reasons when multiple thresholds violated": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--file_statements=50', '--file_functions=50', '--file_branches=50', '--file_lines=20' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/Coverage for lines/));
                test.ok(results.grepError(/Coverage for statements/));
                test.ok(results.grepError(/Coverage for branches/));
                test.ok(results.grepError(/Coverage for functions/));
                test.done();
            });
        },
        "should fail with multiple reasons when multiple thresholds violated with negative thresholds": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--file_statements=-2', '--file_functions=-1', '--file_branches=-1', '--file_lines=-2' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Uncovered count for lines/));
                test.ok(results.grepError(/Uncovered count for statements/));
                test.ok(results.grepError(/Uncovered count for branches/));
                test.ok(!results.grepError(/Uncovered count for functions/));
                test.done();
            });
        },
        "should pass with multiple reasons when all thresholds in check": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--file_statements=10', '--file_functions=0', '--file_branches=0', '--file_lines=10', '-v' ], function (results) {
                test.ok(results.succeeded());
                test.ok(!results.grepOutput(/\\"actuals\\"/), "Verbose message not printed as expected");
                test.done();
            });
        },
    })
});
