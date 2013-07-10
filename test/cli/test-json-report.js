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
    Reporter = require('../../lib/report/json'),
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
    "should produce json report consuming coverage file": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            jsonFile = path.resolve(OUTPUT_DIR, 'coverage-final.json'),
            reporter = new Reporter({ dir: OUTPUT_DIR }),
            obj,
            reportObj,
            collector = new Collector();

        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        collector.add(obj);
        reporter.writeReport(collector, true);
        test.ok(existsSync(jsonFile));
        reportObj = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        Object.keys(reportObj).forEach(function (k) {
            delete reportObj[k].l;
        });
        test.deepEqual(obj, reportObj);
        test.done();
    },
    "should produce coverage-final.json at cwd when no options specified": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            jsonFile = path.resolve('coverage-final.json'),
            reporter = new Reporter(),
            collector = new Collector();

        collector.add(JSON.parse(fs.readFileSync(file, 'utf8')));
        reporter.writeReport(collector, true);
        test.ok(existsSync(jsonFile));
        fs.unlinkSync(jsonFile);
        test.done();
    }
};

