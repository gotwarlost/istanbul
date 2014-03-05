#!/usr/bin/env node

/*
 * Test runner for all unit tests, also set up as the "npm test" command for the package.
 *
 * Usage: run.js <test-pat> <force-cover>
 *     where <test-pat> is a string to run only those test cases that have the string in the filename
 *          <force-cover> is set to, say, 1, to indicate that the tests also need to be run in self-cover
 *             mode. Otherwise it is assumed to be true if no pattern is passed in
 *
 *  How self-cover works:
 *
 *      1. First run all the required tests and make sure that they pass
 *      2. Set an environment variable to indicate that self-coverage is in progress
 *      3. Run the equivalent of `istanbul cover test/run-junit.js` which
 *          will "turn on" coverage for all simple unit tests.
 *      4. The CLI tests need to turn on coverage across a process boundary so that
 *          coverage is performed in a sub-process when the commands are forked.
 *          The `cli-helper.js` has specific code to turn this on.
 *          It should be noted that the behavior of CLI tests is not exactly
 *          identical in regular v/s self-cover mode. It is possible for CLI
 *          tests to fail in one mode and pass in the other because of this.
 *          The bottom line is: make changes to `cli-helper.js` with great care :)
 *      5. The browser test is a similar beast in that the local server sends regular
 *          versus covered versions of instrumenter.js to the phantomJS browser
 *          based on the coverage environment variable. This test is less
 *          sensitive to modes of operation.
 */

/*jslint nomen: true */
var nodeunit = require('nodeunit'),
    fs = require('fs'),
    path = require('path'),
    loader = require('./loader'),
    child_process = require('child_process'),
    rimraf = require('rimraf'),
    common = require('./common'),
    cliHelper = require('./cli-helper');

function runTests(pat, forceCover) {
    var defaultReporter = nodeunit.reporters['default'],
        selfCover = forceCover || !pat,
        args,
        proc;

    cliHelper.setVerbose(process.env.VERBOSE);
    loader.runTests(pat, defaultReporter, undefined, function (err) {
        var coverageDir = common.getCoverageDir();
        //if any test failed then we cannot obviously run self-coverage
        if (err) { throw err; }
        if (selfCover) {
            //delet the build dir
            rimraf.sync(common.getBuildDir());
            //set up environment variable to set CLI and browser
            //tests know that they need to run in self-cover mode
            common.setSelfCover(true);
            console.log('Running self-coverage....');
            // run the equivalent of
            // $ istanbul cover run-again.js -- <pat>
            args = [
                path.resolve(__dirname, '..', 'lib', 'cli.js'),
                'cover',
                '--self-test',
                '--dir',
                coverageDir,
                '--report',
                'none',
                '--x',
                '**/node_modules/**',
                '--x',
                '**/test/**',
                '--x',
                '**/yui-load-hook.js',
                path.resolve(__dirname, 'run-again.js'),
                '--',
                pat || ''
            ];
            console.log('Run node ' + args.join(' '));
            proc = child_process.spawn('node', args);
            proc.stdout.on('data', function (data) { process.stdout.write(data); });
            proc.stderr.on('data', function (data) { process.stderr.write(data); });
            proc.on('exit', function (exitCode) {
                if (exitCode !== 0) {
                    throw new Error('self-cover returned exit code [' + exitCode + ']');
                }
                var Collector = require('../lib/collector'),
                    collector = new Collector(),
                    Report = require('../lib/report'),
                    reporter = Report.create('lcov', { dir: coverageDir }),
                    summary = Report.create('text-summary'),
                    detail = Report.create('text');
                fs.readdirSync(coverageDir).forEach(function (file) {
                    if (file.indexOf('cov') === 0 && file.indexOf('.json') > 0) {
                        collector.add(JSON.parse(fs.readFileSync(path.resolve(coverageDir, file), 'utf8')));
                    }
                });
                reporter.writeReport(collector, true);
                detail.writeReport(collector, true);
                summary.writeReport(collector, true);
            });
        }
    });
}

runTests(process.argv[2], process.argv[3]);


