/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    COMMAND = 'cover',
    DIR = path.resolve(__dirname, 'sample-project'),
    DIR_LINK = path.resolve(__dirname, 'sample-project-link'),
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
    "should cover tests as expected": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-v' ], function (results) {
            test.ok(results.succeeded());
            test.ok(results.grepError(/Module load hook:/));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json'), 'utf8')),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/foo/) || k.match(/bar/); });
            test.ok(filtered.length === 2, 'Filtered was ' + filtered);
            test.done();
        });
    },
    "should cover tests running every possible report": function (test) {
        helper.setOpts({ lazyHook : true });
        var cmd = [ 'test/run.js', '-v', '--print=none'],
            rpts = [ 'none', 'lcovonly', 'html', 'lcov', 'cobertura', 'clover', 'teamcity', 'json'];
        rpts.forEach(function (r) {
            cmd.push('--report=' + r);
        });
        run(cmd, function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage-final.json')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'cobertura-coverage.xml')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'clover.xml')));
            test.done();
        });
    },
    "should include all files after running tests": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '0', '-v', '--ext=js', '--ext=.ts', '--include-all-sources',
                '-x', 'lib/util/bad.js', '-x', 'lib/util/es-module.js' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json'), 'utf8')),
                unloadedFilePath = path.resolve(OUTPUT_DIR, '..', 'includeAllSources', 'unloadedFile.js'),
                unloadedFileWithFnPath = path.resolve(OUTPUT_DIR, '..', 'includeAllSources', 'unloadedFileWithFunctionDeclaration.js'),
                unloadedFile = coverage[unloadedFilePath],
                unloadedFileWithFn = coverage[unloadedFileWithFnPath];

            Object.keys(unloadedFile.s).forEach(function (statement) {
                test.ok(unloadedFile.s[statement] === 0);
            });
            Object.keys(unloadedFileWithFn.s).forEach(function (statement) {
                test.ok(unloadedFileWithFn.s[statement] === 0);
            });

            test.done();
        });
    },
    "should cover tests as expected without extra noise and not covering excluded files": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-x', '**/foo.js' ], function (results) {
            test.ok(results.succeeded());
            test.ok(!results.grepError(/Module load hook:/));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json'), 'utf8')),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/foo/); });
            test.ok(filtered.length === 0);
            test.done();
        });
    },
    "should cover tests as expected without extra noise and using includes": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-i', '**/foo.js' ], function (results) {
            test.ok(results.succeeded());
            test.ok(!results.grepError(/Module load hook:/));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json'), 'utf8')),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/foo/); });
            test.ok(filtered.length !== 0);
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/bar/); });
            test.ok(filtered.length === 0);
            test.done();
        });
    },
    "should skip reporting when requested": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '--report', 'none', '--print', 'detail' ], function (results) {
            test.ok(results.succeeded());
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json')));
            test.done();
        });
    },
    "should use non-default report format when requested": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '--report', 'lcovonly' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json')));
            test.done();
        });
    },
    "should cover nothing when everything excluded": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '-x', '**/*.js' ], function (results) {
            test.ok(results.succeeded());
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(!existsSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json')));
            test.done();
        });
    },
    "should cover everything under the sun when default excludes are suppressed": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/run.js', '--no-default-exclude', '--no-include-all-sources' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json'), 'utf8')),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/node_modules/); });
            test.ok(filtered.length === 1, "Filtered was " + filtered);
            test.done();
        });
    },
    "should barf when no file is provided": function (test) {
        run([], function (results) {
            test.ok(!results.succeeded());
            test.ok(results.grepError(/Need a filename argument for the cover command/));
            test.done();
        });
    },
    "should work with RequireJS and AMD modules": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/amd-run.js', '-v', '--hook-run-in-context', '--no-include-all-sources' ], function (results) {
            test.ok(results.succeeded());
            test.ok(results.grepError(/Module load hook:/));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json'), 'utf8')),
                ipsumPath = path.join('amd', 'ipsum'),
                loremPath = path.join('amd', 'lorem'),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.indexOf(ipsumPath) >= 0 || k.indexOf(loremPath) >= 0; });
            test.ok(filtered.length === 2);
            test.ok(filtered.length === Object.keys(coverage).length);
            test.done();
        });
    },
    "should not introduce globals in the middle of running a test": function (test) {
        helper.setOpts({ lazyHook : true });
        run([ 'test/global-leak.js', '-v' ], function (results) {
            test.ok(results.succeeded());
            test.done();
        });
    },
    "should cover tests when under symlink": function (test) {
        try {
            fs.symlinkSync(DIR, DIR_LINK);
        } catch (ex) {
            if (ex.code === 'EPERM') {
                console.error('#');
                console.error('# Skipping symlink test');
                console.error('# ' + ex.message);
                console.error('#');
                test.ok(true);
                test.done();
            } else {
              throw ex;
            }
            return;
        }
        helper.setOpts({ cwd: DIR_LINK, lazyHook : true });
        run([ 'test/run.js', '-v' ], function (results) {
            test.ok(results.succeeded());
            test.ok(results.grepError(/Module load hook:/));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov.info')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'lcov-report')));
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json')));
            var coverage = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_DIR, 'coverage.raw.json'), 'utf8')),
                filtered;
            filtered = Object.keys(coverage).filter(function (k) { return k.match(/foo/) || k.match(/bar/); });
            test.ok(filtered.length === 2);
            fs.unlinkSync(DIR_LINK);
            test.done();
        });
    }
};
