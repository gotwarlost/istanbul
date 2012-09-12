/*jslint nomen: true */
var path = require('path'),
    fileset = require('fileset'),
    root = path.resolve(__dirname, 'data', 'matcher'),
    src = '../../lib/util/file-matcher.js',
    fileMatcher = require(src),
    allFiles;

module.exports = {
    setUp: function (cb) {
        if (!allFiles) {
            fileset('**/*.js', '', { cwd: root}, function (err, files) {
                allFiles = files.map(function (file) { return path.resolve(root, file); });
                cb();
            });
        } else {
            cb();
        }
    },
    "should return all files except those under node_modules by default": function (test) {
        fileMatcher.filesFor(function (err, files) {
            test.ok(!err);
            allFiles.forEach(function (file) {
                var matcher = function (f) { return f === file; },
                    shouldMatch = file.indexOf('file.js') < 0;
                if (shouldMatch) {
                    test.ok(files.filter(matcher).length, 'Should match [' + file + '] but did not');
                } else {
                    test.ok(!files.filter(matcher).length, 'Should NOT match [' + file + '] but did');
                }
            });
            test.done();
        });
    },
    "should return relative filenames when requested": function (test) {
        fileMatcher.filesFor({ root: root, relative: true }, function (err, files) {
            test.ok(!err);
            allFiles.forEach(function (file) {
                var matcher = function (f) { return path.resolve(root, f) === file; },
                    shouldMatch = file.indexOf('file.js') < 0;
                if (shouldMatch) {
                    test.ok(files.filter(matcher).length, 'Should match [' + file + '] but did not');
                } else {
                    test.ok(!files.filter(matcher).length, 'Should NOT match [' + file + '] but did');
                }
            });
            test.done();
        });
    },
    "should match stuff under cwd": function (test) {
        fileMatcher.matcherFor(function (err, matchFn) {
            test.ok(!err);
            test.ok(matchFn(path.resolve(__dirname, src)), 'should match itself');
            test.done();
        });
    },
    "should match stuff under cwd overriding relative opts passed in": function (test) {
        fileMatcher.matcherFor({ relative: true }, function (err, matchFn) {
            test.ok(!err);
            test.ok(matchFn(path.resolve(__dirname, src)), 'should match itself');
            test.done();
        });
    },
    "should ignore node_modules": function (test) {
        fileMatcher.matcherFor({ root: root }, function (err, matchFn) {
            test.ok(!err);
            allFiles.forEach(function (file) {
                var shouldMatch = file.indexOf('file.js') < 0;
                if (shouldMatch) {
                    test.ok(matchFn(file), 'Should match [' + file + '] but did not');
                } else {
                    test.ok(!matchFn(file), 'Should NOT match [' + file + '] but did');
                }
            });
            test.done();
        });
    },
    "should match stuff with explicit includes and excludes": function (test) {
        fileMatcher.matcherFor({ root: root, includes: [ '**/general/**/*.js' ], excludes: [ '**/general.js' ] }, function (err, matchFn) {
            test.ok(!err);
            allFiles.forEach(function (file) {
                if (file.indexOf('/general/') < 0) { return; }
                var shouldMatch = file.indexOf('file.js') >= 0;
                if (shouldMatch) {
                    test.ok(matchFn(file), 'Should match [' + file + '] but did not');
                } else {
                    test.ok(!matchFn(file), 'Should NOT match [' + file + '] but did');
                }
            });
            test.done();
        });
    }
};
