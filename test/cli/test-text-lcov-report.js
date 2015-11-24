/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    helper = require('../cli-helper'),
    DIR = path.resolve(__dirname, 'sample-project'),
    OUTPUT_DIR = path.resolve(DIR, 'coverage'),
    COVER_COMMAND = 'cover',
    runCover = helper.runCommand.bind(null, COVER_COMMAND),
    Reporter = require('../../lib/report/text-lcov'),
    Collector = require('../../lib/collector');

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
    "should print lcov.info to standard out": function (test) {
        var output = '',
            file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            reporter = new Reporter({
                log: function (ln) {
                    output += ln;
                }
            }),
            collector = new Collector();

        collector.add(JSON.parse(fs.readFileSync(file, 'utf8')));
        reporter.writeReport(collector, true);
        test.ok(output.match('TN:SF:'), 'failed to output report');
        test.done();
    }
};
