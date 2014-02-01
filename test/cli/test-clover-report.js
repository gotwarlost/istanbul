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
    Reporter = require('../../lib/report/clover'),
    Collector = require('../../lib/collector'),
    existsSync = fs.existsSync || path.existsSync;

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
    "should produce clover report consuming coverage file": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            reportFile = path.resolve(OUTPUT_DIR, 'clover.xml'),
            reporter = new Reporter({ dir: OUTPUT_DIR }),
            obj,
            collector = new Collector();

        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        collector.add(obj);
        reporter.writeReport(collector, true);
        test.ok(existsSync(reportFile));
        test.done();
    },
    "should produce clover.xml at cwd when no options specified": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            reportFile = path.resolve('clover.xml'),
            reporter = new Reporter(),
            collector = new Collector();

        collector.add(JSON.parse(fs.readFileSync(file, 'utf8')));
        reporter.writeReport(collector, true);
        test.ok(existsSync(reportFile));
        fs.unlinkSync(reportFile);
        test.done();
    }
};

