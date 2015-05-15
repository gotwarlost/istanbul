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
    runCover = helper.runCommand.bind(null, COVER_COMMAND),
    Report = require('../../lib/report');

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
        run([ 'html' ], function (results) {
            test.ok(results.succeeded());
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'index.html')));
            test.done();
        });
    },
    "should barf on invalid format": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ 'gcov' ], function (results) {
            test.ok(!results.succeeded());
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(results.grepError(/Invalid report format/));
            test.done();
        });
    },
    "should respect input pattern": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ 'lcovonly', '--include', '**/foobar.json' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.equal('', fs.readFileSync(path.resolve(OUTPUT_DIR, 'lcov.info'), 'utf8'));
            test.done();
        });
    },
    "should respect legacy input pattern": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ 'lcovonly', '**/foobar.json' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.equal('', fs.readFileSync(path.resolve(OUTPUT_DIR, 'lcov.info'), 'utf8'));
            test.ok(results.grepError(/DEPRECATION WARNING/));
            test.done();
        });
    },
    "should run all possible reports when requested": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '-v' ].concat(Report.getReportList()), function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'cobertura-coverage.xml')));
            test.done();
        });
    },
    "should default to configuration value": function (test) {
        test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
        run([ '--config', 'config.istanbul.yml' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'foo.xml')));
            test.done();
        });
    }
};