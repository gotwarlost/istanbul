/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    helper = require('../cli-helper'),
    DIR = path.resolve(__dirname, 'sample-project'),
    OUTPUT_DIR = path.resolve(DIR, 'coverage'),
    COVER_COMMAND = 'cover',
    runCover = helper.runCommand.bind(null, COVER_COMMAND),
    Reporter = require('../../lib/report/lcov'),
    Collector = require('../../lib/collector'),
    existsSync = fs.existsSync || path.existsSync,
    filename,
    cov;

module.exports = {
    setUp: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        mkdirp.sync(OUTPUT_DIR);
        helper.resetOpts();
        runCover([ 'test/run.js', '--report', 'none' ], function (results) {
            cb();
        });
    },
    tearDown: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        cb();
    },
    "should produce lcov report consuming coverage file": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            lcovFile = path.resolve(OUTPUT_DIR, 'lcov.info'),
            lcovReport = path.resolve(OUTPUT_DIR, 'lcov-report'),
            reporter = new Reporter({ dir: OUTPUT_DIR }),
            obj,
            collector = new Collector();

        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        collector.add(obj);
        reporter.writeReport(collector, true);
        test.ok(existsSync(lcovFile));
        test.ok(existsSync(lcovReport));
        test.done();
    },
    "should produce lcov.info and lcov-report at cwd when no options specified": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            lcovFile = path.resolve('lcov.info'),
            lcovReport = path.resolve('lcov-report'),
            reporter = new Reporter(),
            collector = new Collector();

        collector.add(JSON.parse(fs.readFileSync(file, 'utf8')));
        reporter.writeReport(collector, true);
        test.ok(existsSync(lcovFile));
        fs.unlinkSync(lcovFile);
        rimraf.sync(lcovReport);
        test.done();
    }
};

