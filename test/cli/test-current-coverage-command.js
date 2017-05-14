/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    COMMAND = 'current-coverage',
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
    "Current coverage": {
        "should fail with a difficult baseline": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--baseline', '99' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(!results.grepError(/No coverage files found/));
                test.ok(results.grepError(/does not meet baseline threshold/));
                test.done();
            });
        },
        "should pass with a reachable baseline": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--baseline', '71' ], function (results) {
                test.ok(results.succeeded());
                test.ok(!results.grepError(/No coverage files found/));
                test.ok(!results.grepError(/does not meet baseline threshold/));
                test.ok(results.grepOutput(/SUCCESS: Current Coverage/));
                test.ok(results.grepOutput(/71\.64%/));
                test.ok(results.grepOutput(/is either equal or better than the baseline/));
                test.ok(results.grepOutput(/71%/));
                test.done();
            });
        },
        "should pass with a 0 baseline": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--baseline', '0' ], function (results) {
                test.ok(results.succeeded());
                test.ok(!results.grepError(/No coverage files found/));
                test.ok(!results.grepError(/does not meet baseline threshold/));
                test.ok(results.grepOutput(/SUCCESS: Current Coverage/));
                test.ok(results.grepOutput(/71\.64%/));
                test.ok(results.grepOutput(/is either equal or better than the baseline/));
                test.ok(results.grepOutput(/0%/));
                test.done();
            });
        },
        "should pass without a baseline but using the txt file": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([], function (results) {
                test.ok(results.succeeded());
                test.ok(!results.grepError(/No coverage files found/));
                test.ok(!results.grepError(/does not meet baseline threshold/));
                test.ok(results.grepOutput(/SUCCESS: Current Coverage/));
                test.ok(results.grepOutput(/71\.64%/));
                test.ok(results.grepOutput(/is either equal or better than the baseline/));
                test.done();
            });
        }
    }
};
