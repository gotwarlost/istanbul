/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    COMMAND = 'check-coverage',
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

            // Mutate coverage.json to test relative key paths.
            var covObj = require('./sample-project/coverage/coverage.json');
            var relCovObj = {};
            var relCovDotSlashObj = {};
            Object.keys(covObj).forEach(function (key) {
                var relKey = path.relative(__dirname + '/sample-project', key);
                relCovObj[relKey] = covObj[key];
                relCovDotSlashObj['./' + relKey] = covObj[key];
            });
            fs.writeFileSync(path.resolve(__dirname, 'sample-project/coverage/relative.json'), JSON.stringify(relCovObj));
            fs.writeFileSync(path.resolve(__dirname, 'sample-project/coverage/relative-dot-slash.json'), JSON.stringify(relCovDotSlashObj));

            cb();
        });
    },
    tearDown: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        cb();
    },
    "Global coverage": {
        "should fail on inadequate statement coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(results.grepError(/Coverage for statements .* global/));
                test.done();
            });
        },
        "should fail on inadequate branch coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--branches', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(results.grepError(/Coverage for branches .* global/));
                test.done();
            });
        },
        "should fail on inadequate function coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--functions', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(results.grepError(/Coverage for functions .* global/));
                test.done();
            });
        },
        "should fail on inadequate line coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--lines', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(results.grepError(/Coverage for lines .* global/));
                test.done();
            });
        },
        "should fail with multiple reasons when multiple thresholds violated": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements=72', '--functions=50', '--branches=72', '--lines=72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(results.grepError(/Coverage for lines .* global/));
                test.ok(results.grepError(/Coverage for statements .* global/));
                test.ok(results.grepError(/Coverage for branches .* global/));
                test.ok(!results.grepError(/Coverage for functions .* global/));
                test.done();
            });
        },
        "should fail with multiple reasons from configuration file": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            // YML equivalent to: '--statements=72', '--functions=50', '--branches=72', '--lines=72'
            run([ '--config', 'config-check-global.istanbul.yml' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(results.grepError(/Coverage for lines .* global/));
                test.ok(results.grepError(/Coverage for statements .* global/));
                test.ok(results.grepError(/Coverage for branches .* global/));
                test.ok(!results.grepError(/Coverage for functions .* global/));
                test.done();
            });
        },
        "should fail with multiple reasons from configuration file and command line": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            // YML equivalent to: '--statements=72', '--functions=50', '--branches=72', '--lines=72'
            run([ '--statements=10', '--config', 'config-check-global.istanbul.yml' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(results.grepError(/Coverage for lines .* global/));
                test.ok(!results.grepError(/Coverage for statements .* global/));
                test.ok(results.grepError(/Coverage for branches .* global/));
                test.ok(!results.grepError(/Coverage for functions .* global/));
                test.done();
            });
        },
        "should fail with multiple reasons when multiple thresholds violated with negative thresholds": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements=-3', '--functions=-10', '--branches=-1', '--lines=-3' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(results.grepError(/Uncovered count for lines .* global/));
                test.ok(results.grepError(/Uncovered count for statements .* global/));
                test.ok(results.grepError(/Uncovered count for branches .* global/));
                test.ok(!results.grepError(/Uncovered count for functions .* global/));
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
        "should fail when no coverage found": function (test) {
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'no-matching-coverage.json')));
            run([ 'no-matching-coverage.json' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(results.grepError(/No coverage files found./));
                test.done();
            });
        }
    },
    "Per-file coverage": {
        "should fail on inadequate statement and line coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--config', 'config-check-each.istanbul.yml' ], function (results) {
                // vendor/dummy_vendor_lib.js (statements 66.67% vs. 72%)
                // vendor/dummy_vendor_lib.js (lines 66.67% vs. 72%)
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(!results.grepError(/Coverage for lines .* global/));
                test.ok(results.grepError(/Coverage for lines .* per-file/));
                test.ok(results.grepError(/Coverage for statements .* per-file/));
                test.ok(!results.grepError(/Coverage for branches .* per-file/));
                test.ok(!results.grepError(/Coverage for functions .* per-file/));
                test.ok(results.grepError(/dummy_vendor_lib\.js/));
                test.ok(!results.grepError(/foo\.js/));
                test.ok(!results.grepError(/foo\.js/));
                test.done();
            });
        },
        "should fail on inadequate statement and line coverage with relative coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'relative.json')));
            run([ '--config', 'config-check-each.istanbul.yml', 'coverage/relative.json' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(!results.grepError(/Coverage for lines .* global/));
                test.ok(results.grepError(/Coverage for lines .* per-file/));
                test.ok(results.grepError(/Coverage for statements .* per-file/));
                test.ok(!results.grepError(/Coverage for branches .* per-file/));
                test.ok(!results.grepError(/Coverage for functions .* per-file/));
                test.ok(results.grepError(/dummy_vendor_lib\.js/));
                test.ok(!results.grepError(/foo\.js/));
                test.ok(!results.grepError(/foo\.js/));
                test.done();
            });
        },
        "should fail on inadequate statement and line coverage with relative './' key coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'relative-dot-slash.json')));
            run([ '--config', 'config-check-each.istanbul.yml', 'coverage/relative-dot-slash.json' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(!results.grepError(/Coverage for lines .* global/));
                test.ok(results.grepError(/Coverage for lines .* per-file/));
                test.ok(results.grepError(/Coverage for statements .* per-file/));
                test.ok(!results.grepError(/Coverage for branches .* per-file/));
                test.ok(!results.grepError(/Coverage for functions .* per-file/));
                test.ok(results.grepError(/dummy_vendor_lib\.js/));
                test.ok(!results.grepError(/foo\.js/));
                test.ok(!results.grepError(/foo\.js/));
                test.done();
            });
        },
        "should fail on inadequate mixed global args / each coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--branches=100', '--functions=100', '--config', 'config-check-each.istanbul.yml' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(!results.grepError(/Coverage for lines .* global/));
                test.ok(!results.grepError(/Coverage for statements .* global/));
                test.ok(results.grepError(/Coverage for branches .* global/));
                test.ok(results.grepError(/Coverage for functions .* global/));
                test.ok(results.grepError(/Coverage for lines .* per-file/));
                test.ok(results.grepError(/Coverage for statements .* per-file/));
                test.ok(!results.grepError(/Coverage for branches .* per-file/));
                test.ok(!results.grepError(/Coverage for functions .* per-file/));
                test.done();
            });
        },
        "should fail on inadequate mixed global / each configured coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--config', 'config-check-mixed.istanbul.yml' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/lib[\\\/]cli.js:/));
                test.ok(!results.grepError(/Coverage for lines .* global/));
                test.ok(results.grepError(/Coverage for statements .* global/));
                test.ok(!results.grepError(/Coverage for branches .* global/));
                test.ok(results.grepError(/Coverage for functions .* global/));
                test.ok(results.grepError(/Coverage for lines .* per-file/));
                test.ok(results.grepError(/Coverage for statements .* per-file/));
                test.ok(!results.grepError(/Coverage for branches .* per-file/));
                test.ok(!results.grepError(/Coverage for functions .* per-file/));
                test.done();
            });
        }
    }
};
