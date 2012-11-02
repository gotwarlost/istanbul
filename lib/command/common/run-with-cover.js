/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var Module = require('module'),
    path = require('path'),
    fs = require('fs'),
    nopt = require('nopt'),
    which = require('which'),
    mkdirp = require('mkdirp'),
    existsSync = fs.existsSync || path.existsSync,
    inputError = require('../../util/input-error'),
    matcherFor = require('../../util/file-matcher').matcherFor,
    Instrumenter = require('../../instrumenter'),
    Collector = require('../../collector'),
    formatOption = require('../../util/help-formatter').formatOption,
    hook = require('../../hook'),
    Report = require('../../report'),
    DEFAULT_REPORT_FORMAT = 'lcov';

function usage(arg0, command) {
    console.error('\nUsage: ' + arg0 + ' ' + command + ' [<options>] <executable-js-file-or-command> [-- <arguments-to-jsfile>]\n\nOptions are:\n\n'
        + [
            formatOption('--root <path> ', 'the root path to look for files to instrument, defaults to .'),
            formatOption('-x <exclude-pattern> [-x <exclude-pattern>]', 'one or more fileset patterns e.g. "**/vendor/**"'),
            formatOption('--[no-]default-excludes', 'apply default excludes [ **/node_modules/**, **/test/**, **/tests/** ], defaults to true'),
            formatOption('--report <report-type>', 'report type, one of html, lcov, lcovonly, none, defaults to lcov (= lcov.info + HTML)'),
            formatOption('--dir <report-dir>', 'report directory, defaults to ./coverage'),
            formatOption('--print <type>', 'type of report to print to console, one of summary (default), detail, both or none'),
            formatOption('--verbose, -v', 'verbose mode')
        ].join('\n\n') + '\n');
    console.error('\n');
}

function run(args, commandName, enableHooks, callback) {

    var config = {
            root: path,
            x: [Array, String],
            report: String,
            dir: path,
            verbose: Boolean,
            yui: Boolean,
            'default-excludes': Boolean,
            print: String,
            'self-test': Boolean
        },
        opts = nopt(config, { v : '--verbose' }, args, 0),
        cmdAndArgs = opts.argv.remain,
        cmd,
        cmdArgs,
        reportingDir,
        reportClassName,
        reports = [],
        runFn,
        excludes;

    if (cmdAndArgs.length === 0) {
        return callback(inputError.create('Need a filename argument for the ' + commandName + ' command!'));
    }

    cmd = cmdAndArgs.shift();
    cmdArgs = cmdAndArgs;

    if (!existsSync(cmd)) {
        try {
            cmd = which.sync(cmd);
        } catch (ex) {
            return callback(inputError.create('Unable to resolve file [' + cmd + ']'));
        }
    } else {
        cmd = path.resolve(cmd);
    }

    runFn = function () {
        process.argv = ["node", cmd].concat(cmdArgs);
        if (opts.verbose) {
            console.log('Running: ' + process.argv.join(' '));
        }
        process.env.running_under_istanbul=1;
        Module.runMain(cmd, null, true);
    };

    excludes = typeof opts['default-excludes'] === 'undefined' || opts['default-excludes'] ?
            [ '**/node_modules/**', '**/test/**', '**/tests/**' ] : [];
    excludes.push.apply(excludes, opts.x);

    if (enableHooks) {
        reportingDir = opts.dir || path.resolve(process.cwd(), 'coverage');
        mkdirp.sync(reportingDir); //ensure we fail early if we cannot do this
        reportClassName = opts.report || DEFAULT_REPORT_FORMAT;
        reports.push(Report.create(reportClassName, { dir: reportingDir }));
        if (opts.print !== 'none') {
            switch (opts.print) {
            case 'detail':
                reports.push(Report.create('text'));
                break;
            case 'both':
                reports.push(Report.create('text'));
                reports.push(Report.create('text-summary'));
                break;
            default:
                reports.push(Report.create('text-summary'));
                break;
            }
        }

        matcherFor({
            root: opts.root || process.cwd(),
            includes: [ '**/*.js' ],
            excludes: excludes
        },
            function (err, matchFn) {
                if (err) { return callback(err); }

                var coverageVar = '$$cov_' + new Date().getTime() + '$$',
                    instrumenter = new Instrumenter({ coverageVariable: coverageVar }),
                    transformer = instrumenter.instrumentSync.bind(instrumenter),
                    hookOpts = { verbose: opts.verbose };

                if (opts.yui) { //EXPERIMENTAL code: do not rely on this in anyway until the docs say it is allowed
                    hookOpts.postLoadHook = require('../../util/yui-load-hook').getPostLoadHook(matchFn, transformer, opts.verbose);
                }
                if (opts['self-test']) {
                    hook.unloadRequireCache(matchFn);
                }
                hook.hookRequire(matchFn, transformer, hookOpts);
                process.once('exit', function () {
                    var file = path.resolve(reportingDir, 'coverage.json'),
                        collector,
                        cov;
                    if (typeof global[coverageVar] === 'undefined') {
                        console.error('No coverage information was collected, exit without writing coverage information');
                        return;
                    } else {
                        cov = global[coverageVar];
                    }
                    //important: there is no event loop at this point
                    //everything that happens in this exit handler MUST be synchronous
                    mkdirp.sync(reportingDir); //yes, do this again since some test runners could clean the dir initially created
                    console.log('=============================================================================');
                    console.log('Writing coverage object [' + file + ']');
                    fs.writeFileSync(file, JSON.stringify(cov), 'utf8');
                    collector = new Collector();
                    collector.add(cov);
                    console.log('Writing coverage reports at [' + reportingDir + ']');
                    console.log('=============================================================================');
                    reports.forEach(function (report) {
                        report.writeReport(collector, true);
                    });
                    return callback();
                });
                runFn();
            });
    } else {
        runFn();
    }
}

module.exports = {
    run: run,
    usage: usage
};
