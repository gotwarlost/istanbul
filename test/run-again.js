#!/usr/bin/env node

var nodeunit = require('nodeunit'),
    mkdirp = require('mkdirp'),
    loader = require('./loader'),
    common = require('./common');

function runTests() {
    var outputDir = common.getBuildDir();

    mkdirp.sync(outputDir);
    loader.runTests(process.argv[2], nodeunit.reporters['default'], undefined, function (err) {
        if (err) { throw err; }
    });
}

runTests();


