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
    Reporter = require('../../lib/report/teamcity'),
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
    "should produce teamcity service messages": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            outFile = path.resolve(OUTPUT_DIR, 'teamcity.txt'),
            reporter = new Reporter({ dir: OUTPUT_DIR, file: "teamcity.txt" }),
            obj,
            reportLines,
            collector = new Collector();

        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        collector.add(obj);
        reporter.writeReport(collector, true);
        test.ok(existsSync(outFile));
        reportLines = fs.readFileSync(outFile, 'utf8');

        test.ok(reportLines.indexOf('Code Coverage Summary') > 0);
        test.ok(reportLines.indexOf('CodeCoverageB') > 0);
        test.ok(reportLines.indexOf('CodeCoverageAbsMCovered') > 0);
        test.ok(reportLines.indexOf('CodeCoverageAbsMTotal') > 0);
        test.ok(reportLines.indexOf('CodeCoverageM') > 0);
        test.ok(reportLines.indexOf('CodeCoverageAbsLCovered') > 0);
        test.ok(reportLines.indexOf('CodeCoverageAbsLTotal') > 0);
        test.ok(reportLines.indexOf('CodeCoverageL') > 0);

        test.done();
    }
};

