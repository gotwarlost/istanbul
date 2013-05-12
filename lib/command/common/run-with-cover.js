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
    resolve = require('resolve'),
    DEFAULT_REPORT_FORMAT = 'lcov';

function usage(arg0, command) {
    console.error('\nUsage: ' + arg0 + ' ' + command + ' [<options>] <executable-js-file-or-command> [-- <arguments-to-jsfile>]\n\nOptions are:\n\n'
        + [
            formatOption('--root <path> ', 'the root path to look for files to instrument, defaults to .'),
            formatOption('-x <exclude-pattern> [-x <exclude-pattern>]', 'one or more fileset patterns e.g. "**/vendor/**"'),
            formatOption('--[no-]default-excludes', 'apply default excludes [ **/node_modules/**, **/test/**, **/tests/** ], defaults to true'),
            formatOption('--hook-run-in-context', 'hook vm.runInThisContext in addition to require (supports RequireJS), defaults to false'),
            formatOption('--post-require-hook <file> | <module>', 'JS module that exports a function for post-require processing'),
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
            'self-test': Boolean,
            'hook-run-in-context': Boolean,
            'post-require-hook': String
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
                    hookOpts = { verbose: opts.verbose },
                    postRequireHook = opts['post-require-hook'],
                    postLoadHookFile;

                if (postRequireHook) {
                    postLoadHookFile = path.resolve(postRequireHook);
                } else if (opts.yui) { //EXPERIMENTAL code: do not rely on this in anyway until the docs say it is allowed
                    postLoadHookFile = path.resolve(__dirname, '../../util/yui-load-hook');
                }

                if (postRequireHook) {
                    if (!existsSync(postLoadHookFile)) { //assume it is a module name and resolve it
                        try {
                            postLoadHookFile = resolve.sync(postRequireHook, { basedir: process.cwd() });
                        } catch (ex) {
                            if (opts.verbose) { console.error('Unable to resolve [' + postRequireHook + '] as a node module'); }
                        }
                    }
                }
                if (postLoadHookFile) {
                    if (opts.verbose) { console.log('Use post-load-hook: ' + postLoadHookFile); }
                    hookOpts.postLoadHook = require(postLoadHookFile)(matchFn, transformer, opts.verbose);
                }

                if (opts['self-test']) {
                    hook.unloadRequireCache(matchFn);
                }
                // runInThisContext is used by RequireJS [issue #23]
                if (opts['hook-run-in-context']) {
                    hook.hookRunInThisContext(matchFn, transformer, hookOpts);
                }
                hook.hookRequire(matchFn, transformer, hookOpts);

                //initialize the global variable to stop mocha from complaining about leaks
                global[coverageVar] = {};

                process.once('exit', function () {
                    var file = path.resolve(reportingDir, 'coverage.json'),
                        collector,
                        cov;
                    if (typeof global[coverageVar] === 'undefined' || Object.keys(global[coverageVar]).length === 0) {
                        console.error('No coverage information was collected, exit without writing coverage information');
                        return;
                    } else {
                        cov = global[coverageVar];
                    }
                    //important: there is no event loop at this point
                    //everything that happens in this exit handler MUST be synchronous
                    mkdirp.sync(reportingDir); //yes, do this again since some test runners could clean the dir initially created
                    if (opts.print !== 'none') {
                        console.error('=============================================================================');
                        console.error('Writing coverage object [' + file + ']');
                    }
                    fs.writeFileSync(file, JSON.stringify(cov), 'utf8');
                    collector = new Collector();
                    collector.add(cov);
                    if (opts.print !== 'none') {
                        console.error('Writing coverage reports at [' + reportingDir + ']');
                        console.error('=============================================================================');
                    }
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
