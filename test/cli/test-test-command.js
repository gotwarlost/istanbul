/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    COMMAND = 'test',
    DIR = path.resolve(__dirname, 'sample-project'),
    OUTPUT_DIR = path.resolve(DIR, 'coverage'),
    helper = require('../cli-helper'),
    existsSync = fs.existsSync || path.existsSync,
    run = helper.runCommand.bind(null, COMMAND);

module.exports = {
    setUp: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        mkdirp.sync(OUTPUT_DIR);
        helper.resetOpts();
        cb();
    },
    tearDown: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        cb();
    },
    "should skip coverage when npm coverage is disabled": function (test) {
        run([ 'test/run.js' ], { npm_config_coverage: '' }, function (results) {
            test.ok(results.succeeded());
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            test.done();
        });
    },
    "should run coverage when npm coverage is enabled": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js' ], { npm_config_coverage: '1' }, function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            test.done();
        });
    }
};