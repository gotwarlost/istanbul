/*jslint nomen: true */
/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    COMMAND = 'report',
    COVER_COMMAND = 'cover',
    outputDir = path.resolve(__dirname, 'output'),
    helper = require('../cli-helper'),
    existsSync = fs.existsSync || path.existsSync,
    run = helper.runCommand.bind(null, COMMAND),
    runCover = helper.runCommand.bind(null, COVER_COMMAND),
    MAX_FILES = 1000;

function fileFor(i) {
    return 'f' + i + '.js';
}

function createCode() {
    var i,
        libDir = path.resolve(outputDir, 'lib'),
        code;

    mkdirp.sync(libDir);

    for (i = 0; i < MAX_FILES; i += 1) {
        code = 'module.exports = function () { return "hello-' + i + '"; };\n';
        fs.writeFileSync(path.resolve(libDir, fileFor(i)), code, 'utf8');
    }
}

function createTest() {
    var i,
        testDir = path.resolve(outputDir, 'test'),
        code = 'var assert = require("assert");\n';

    mkdirp.sync(testDir);

    for (i = 0; i < MAX_FILES; i += 1) {
        code += 'assert.equal("hello-' + i + '", require("../lib/' + fileFor(i) + '")());\n';
    }
    fs.writeFileSync(path.resolve(testDir, 'test.js'), code, 'utf8');
}

module.exports = {
    setUp: function (cb) {
        helper.resetOpts();
        helper.setOpts({ cwd: outputDir });
        mkdirp.sync(outputDir);
        cb();
    },
    tearDown: function (cb) {
        rimraf.sync(outputDir);
        cb();
    },

    'should report correctly with 1000 code files': function (test) {
        var coverageDir = path.resolve(outputDir, 'coverage'),
            lcovFile = path.resolve(coverageDir, 'lcov.info'),
            lcovDir = path.resolve(coverageDir, 'lcov-report'),
            jsonFile = path.resolve(coverageDir, 'coverage.json');
        createCode();
        createTest();
        runCover([ 'test/test.js' ], function (results) {
            test.ok(results.succeeded());
            test.ok(existsSync(lcovFile));
            test.ok(existsSync(lcovDir));
            test.ok(existsSync(jsonFile));
            var obj = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
            test.equal(MAX_FILES, Object.keys(obj).length);
            rimraf.sync(lcovDir);
            fs.unlinkSync(lcovFile);
            run([], function (results) {
                test.ok(results.succeeded());
                test.ok(existsSync(lcovFile));
                test.ok(existsSync(lcovDir));
                test.ok(existsSync(jsonFile));
                test.ok(fs.readdirSync(path.resolve(lcovDir, 'lib')).length >= MAX_FILES);
                test.done();
            });
        });
    }
};



