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
    Reporter = require('../../lib/report/html'),
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
    "should test files written": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            htmlReport = path.resolve(OUTPUT_DIR),
            reporter = new Reporter({ dir: OUTPUT_DIR, verbose: true }),
            obj,
            collector = new Collector(),
            fileFor = function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(htmlReport);
                return path.resolve.apply(null, args);
            };

        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        collector.add(obj);
        reporter.writeReport(collector, true);
        test.ok(existsSync(htmlReport));
        test.ok(existsSync(fileFor('index.html')));
        test.ok(existsSync(fileFor('lib', 'index.html')));
        test.ok(existsSync(fileFor('lib', 'util', 'index.html')));
        test.ok(existsSync(fileFor('lib', 'foo.js.html')));
        test.ok(existsSync(fileFor('lib', 'bar.js.html')));
        test.ok(existsSync(fileFor('lib', 'util', 'generate-names.js.html')));
        test.ok(fs.readFileSync(fileFor('lib', 'bar.js.html'), 'utf8') !== '');
        test.done();
    },

    "should test files written with defaults": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            htmlReport = path.resolve(process.cwd(), 'html-report'),
            reporter = new Reporter(),
            obj,
            collector = new Collector(),
            fileFor = function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(htmlReport);
                return path.resolve.apply(null, args);
            };

        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        collector.add(obj);
        reporter.writeReport(collector, true);
        test.ok(existsSync(htmlReport));
        test.ok(existsSync(fileFor('index.html')));
        test.ok(existsSync(fileFor('lib', 'bar.js.html')));
        test.ok(fs.readFileSync(fileFor('lib', 'bar.js.html'), 'utf8') !== '');
        test.done();
    },

    "should test files written with Unix Line Endings (LF)": function (test) {
        var barPath = path.resolve(DIR, 'lib', 'bar.js'),
            oldBar = fs.readFileSync(barPath, 'utf8'),
            eol = /(\r?\n|\r)/g,
            newBar = oldBar.replace(eol, "\n"),
			file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            htmlReport = path.resolve(process.cwd(), 'html-report'),
            reporter = new Reporter(),
            obj,
            collector = new Collector(),
            fileFor = function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(htmlReport);
                return path.resolve.apply(null, args);
            };

		fs.writeFileSync(barPath, newBar);
        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        collector.add(obj);
        try {
            reporter.writeReport(collector, true);
        } catch(err) {
            test.ok(false);
        } finally {
            fs.writeFileSync(barPath, oldBar);
        }
        test.ok(existsSync(htmlReport));
        test.ok(existsSync(fileFor('index.html')));
        test.ok(existsSync(fileFor('lib', 'bar.js.html')));
        test.ok(fs.readFileSync(fileFor('lib', 'bar.js.html'), 'utf8') !== '');
        test.done();
    },

    "should test files written with Windows Line Endings (CRLF)": function (test) {
        var barPath = path.resolve(DIR, 'lib', 'bar.js'),
            oldBar = fs.readFileSync(barPath, 'utf8'),
            eol = /(\r?\n|\r)/g,
            newBar = oldBar.replace(eol, "\r\n"),
			file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            htmlReport = path.resolve(process.cwd(), 'html-report'),
            reporter = new Reporter(),
            obj,
            collector = new Collector(),
            fileFor = function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(htmlReport);
                return path.resolve.apply(null, args);
            };

		fs.writeFileSync(barPath, newBar);
        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        collector.add(obj);
        try {
            reporter.writeReport(collector, true);
        } catch(err) {
            test.ok(false);
        } finally {
            fs.writeFileSync(barPath, oldBar);
        }
        test.ok(existsSync(htmlReport));
        test.ok(existsSync(fileFor('index.html')));
        test.ok(existsSync(fileFor('lib', 'bar.js.html')));
        test.ok(fs.readFileSync(fileFor('lib', 'bar.js.html'), 'utf8') !== '');
        test.done();
    },

    "should test files written with Macintosh Line Endings (CR)": function (test) {
        var barPath = path.resolve(DIR, 'lib', 'bar.js'),
            oldBar = fs.readFileSync(barPath, 'utf8'),
            eol = /(\r?\n|\r)/g,
            newBar = oldBar.replace(eol, "\r"),
			file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            htmlReport = path.resolve(process.cwd(), 'html-report'),
            reporter = new Reporter(),
            obj,
            collector = new Collector(),
            fileFor = function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(htmlReport);
                return path.resolve.apply(null, args);
            };

		fs.writeFileSync(barPath, newBar);
        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        collector.add(obj);
        try {
            reporter.writeReport(collector, true);
        } catch(err) {
            test.ok(false);
        } finally {
            fs.writeFileSync(barPath, oldBar);
        }
        test.ok(existsSync(htmlReport));
        test.ok(existsSync(fileFor('index.html')));
        test.ok(existsSync(fileFor('lib', 'bar.js.html')));
        test.ok(fs.readFileSync(fileFor('lib', 'bar.js.html'), 'utf8') !== '');
        test.done();
    },

    "should test files written when code packed into coverage object": function (test) {
        var file = path.resolve(OUTPUT_DIR, 'coverage.json'),
            htmlReport = path.resolve(OUTPUT_DIR),
            reporter = new Reporter({ dir: OUTPUT_DIR, verbose: true }),
            obj,
            copy = {},
            collector = new Collector(),
            mangler = function (name) {
                return name.replace(/\.js/,'-mangled.js');
            },
            fileFor = function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(htmlReport);
                return mangler(path.resolve.apply(null, args));
            },
            contentFor = function (file) {
                return fs.readFileSync(file, 'utf8').split(/\r?\n/);
            };

        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        //stick in the code and mangle the file paths in the coverage object so that default behavior will not work
        Object.keys(obj).forEach(function (k) {
            var code = contentFor(k),
                mangled = mangler(k);
            obj[k].code = code;
            obj[k].path = mangled;
            copy[mangled] = obj[k];
            test.ok(mangled !== k); //verify something _did_ get mangled
            test.ok(copy[mangled].code);
        });
        collector.add(copy);
        reporter.writeReport(collector, true);
        test.ok(existsSync(htmlReport));
        test.ok(existsSync(fileFor('index.html')));
        test.ok(existsSync(fileFor('lib', 'index.html')));
        test.ok(existsSync(fileFor('lib', 'util', 'index.html')));
        test.ok(existsSync(fileFor('lib', 'foo.js.html')));
        test.ok(existsSync(fileFor('lib', 'bar.js.html')));
        test.ok(existsSync(fileFor('lib', 'util', 'generate-names.js.html')));
        test.ok(fs.readFileSync(fileFor('lib', 'bar.js.html'), 'utf8') !== '');
        test.done();
    },

    "test contents": function (test) {
        console.error('Figure out a way to run meaningful tests for HTML report contents');
        test.ok(1);
        test.done();
    }
};

