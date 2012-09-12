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
    Reporter = require('../../lib/report/lcovonly'),
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
    "should produce lcovonly report consuming coverage file": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            lcovFile = path.resolve(OUTPUT_DIR, 'lcov.info'),
            reporter = new Reporter({ dir: OUTPUT_DIR }),
            obj,
            collector = new Collector(),
            lines,
            numFiles;

        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        numFiles = Object.keys(obj).length;
        collector.add(obj);
        reporter.writeReport(collector, true);
        test.ok(existsSync(lcovFile));
        lines = fs.readFileSync(lcovFile, 'utf8').split(/\r?\n/);
        test.ok(lines.filter(function (line) { return line.indexOf('SF:') === 0; }).length, numFiles);
        test.ok(lines.filter(function (line) { return line.indexOf('TN:') === 0; }).length, numFiles);
        test.ok(lines.filter(function (line) { return line.indexOf('end_of_record') === 0; }).length, numFiles);
        test.done();
    },
    "should produce lcov.info at cwd when no options specified": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            lcovFile = path.resolve('lcov.info'),
            reporter = new Reporter(),
            collector = new Collector();

        collector.add(JSON.parse(fs.readFileSync(file, 'utf8')));
        reporter.writeReport(collector, true);
        test.ok(existsSync(lcovFile));
        fs.unlinkSync(lcovFile);
        test.done();
    }
};

