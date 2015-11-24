/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var Module = require('module'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    nopt = require('nopt'),
    which = require('which'),
    inputError = require('../util/input-error'),
    formatOption = require('../util/help-formatter').formatOption,
    api = require('istanbul-api'),
    cover = api.cover,
    configuration = api.config,
    Command = require('./index');

function CoverCommand() {
    Command.call(this);
}

CoverCommand.TYPE = 'cover';
util.inherits(CoverCommand, Command);

function usage(arg0, command) {

    console.error('\nUsage: ' + arg0 + ' ' + command + ' [<options>] <executable-js-file-or-command> [-- <arguments-to-jsfile>]\n\nOptions are:\n\n'
        + [
            formatOption('--config <path-to-config>', 'the configuration file to use, defaults to .istanbul.yml'),
            formatOption('--root <path> ', 'the root path to look for files to instrument, defaults to .'),
            formatOption('-x <exclude-pattern> [-x <exclude-pattern>]', 'one or more fileset patterns e.g. "**/vendor/**"'),
            formatOption('-i <include-pattern> [-i <include-pattern>]', 'one or more fileset patterns e.g. "**/*.js"'),
            formatOption('--[no-]default-excludes', 'apply default excludes [ **/node_modules/**, **/test/**, **/tests/** ], defaults to true'),
            formatOption('--hook-run-in-context', 'hook vm.runInThisContext in addition to require (supports RequireJS), defaults to false'),
            formatOption('--report <format> [--report <format>] ', 'report format, defaults to lcov (= lcov.info + HTML)'),
            formatOption('--dir <report-dir>', 'report directory, defaults to ./coverage'),
            formatOption('--print <type>', 'type of report to print to console, one of summary (default), detail, both or none'),
            formatOption('--verbose, -v', 'verbose mode'),
            formatOption('--[no-]preserve-comments', 'remove / preserve comments in the output, defaults to false'),
            formatOption('--include-all-sources', 'instrument all unused sources after running tests, defaults to true'),
            formatOption('--[no-]include-pid', 'include PID in output coverage filename')
        ].join('\n\n') + '\n');
    console.error('\n');
}

function run(args, callback) {
    var template = {
            config: path,
            root: path,
            x: [ Array, String ],
            report: [Array, String ],
            dir: path,
            verbose: Boolean,
            'default-excludes': Boolean,
            print: String,
            'self-test': Boolean,
            'hook-run-in-context': Boolean,
            'preserve-comments': Boolean,
            'include-all-sources': Boolean,
            i: [ Array, String ],
            'include-pid': Boolean,
            'extension': [ Array, String ]
        },
        opts = nopt(template, { v : '--verbose' }, args, 0),
        overrides = {
            verbose: opts.verbose,
            instrumentation: {
                root: opts.root,
                'default-excludes': opts['default-excludes'],
                excludes: opts.x,
                'include-all-sources': opts['include-all-sources'],
                'include-pid': opts['include-pid']
            },
            reporting: {
                reports: opts.report,
                print: opts.print,
                dir: opts.dir
            },
            hooks: {
                'hook-run-in-context': opts['hook-run-in-context'],
                'handle-sigint': opts['handle-sigint']
            }
        },
        config,
        verbose,
        cmdAndArgs = opts.argv.remain,
        cmd,
        cmdArgs,
        runFn;

    if (opts.extension && opts.extension.length) {
        overrides.instrumentation.extensions = opts.extension.map(function (e) {
            if (e.indexOf('.') !== 0) {
                e = '.' + e;
            }
            return e;
        });
    }
    config = configuration.loadFile(opts.config, overrides);
    verbose = config.verbose;

    if (cmdAndArgs.length === 0) {
        return callback(inputError.create('Need a filename argument for the cover command!'));
    }

    cmd = cmdAndArgs.shift();
    cmdArgs = cmdAndArgs;

    if (!fs.existsSync(cmd)) {
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
        if (verbose) {
            console.log('Running: ' + process.argv.join(' '));
        }
        process.env.running_under_istanbul=1;
        Module.runMain(cmd, null, true);
    };

    cover.getCoverFunctions(config, opts.i, function (err, fns) {
        /* istanbul ignore if */
        if (err) {
            throw err;
        }
        process.once('exit', fns.exitFn);
        // enable passing --handle-sigint to write reports on SIGINT.
        // This allows a user to manually kill a process while
        // still getting the istanbul report.
        /* istanbul ignore if */
        if (config.hooks.handleSigint()) {
            process.once('SIGINT', process.exit);
        }
        if (opts['self-test']) {
            fns.unhookFn();
        }
        fns.hookFn();
        runFn();
    });
}

Command.mix(CoverCommand, {
    synopsis: function () {
        return "transparently adds coverage information to a node command. Saves coverage.raw.json and reports at the end of execution";
    },

    usage: function () {
        usage(this.toolName(), this.type());
    },

    run: function (args, callback) {
        run(args, callback);
    }
});


module.exports = CoverCommand;

