/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    glob = require('glob'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    COMMAND = 'cover',
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
    "should have no pid by default": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-v'], function (results) {
            test.ok(results.succeeded());
            test.ok(results.grepError(/Module load hook:/));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.json'), 'utf8')),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/foo/) || k.match(/bar/); });
            test.ok(filtered.length === 2);
            test.done();
        });
    },
    "should have no pid if requested": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-v', '--no-include-pid'], function (results) {
            test.ok(results.succeeded());
            test.ok(results.grepError(/Module load hook:/));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.json'), 'utf8')),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/foo/) || k.match(/bar/); });
            test.ok(filtered.length === 2);
            test.done();
        });
    },
    "should have pid if requested": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-v', '--include-pid'], function (results) {
            test.ok(results.succeeded());
            test.ok(results.grepError(/Module load hook:/));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            glob(path.resolve(OUTPUT_DIR, 'coverage-*.json'), function(err, matches) {
              test.ifError(err, 'pid coverage file glob error');
              test.ok(matches.length !== 0, 'pid coverage file not found');
              matches.forEach(function(file) {
                test.ok(existsSync(file));
                var coverage = JSON.parse(fs.readFileSync(file), 'utf8'),
                    filtered;
                filtered = Object.keys(coverage).filter(function (k) { return k.match(/foo/) || k.match(/bar/); });
                test.ok(filtered.length === 2);
              });
              test.done();
            });
        });
    }
};
