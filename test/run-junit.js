#!/usr/bin/env node

var path = require('path'),
    nodeunit = require('nodeunit'),
    mkdirp = require('mkdirp'),
    loader = require('./loader'),
    common = require('./common');

function runTests() {
    var junitReporter = nodeunit.reporters.junit,
        outputDir = common.getBuildDir();

    mkdirp.sync(outputDir);
    loader.runTests(process.argv[2], junitReporter, {
        output: outputDir,
        error_prefix: "\u001B[31m",
        error_suffix: "\u001B[39m",
        ok_prefix: "\u001B[32m",
        ok_suffix: "\u001B[39m",
        bold_prefix: "\u001B[1m",
        bold_suffix: "\u001B[22m",
        assertion_prefix: "\u001B[35m",
        assertion_suffix: "\u001B[39m"
    }, function (err) {
        if (err) { throw err; }
    });
}

runTests();


