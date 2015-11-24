/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    nopt = require('nopt'),
    api = require('istanbul-api'),
    instrument = api.instrument,
    formatOption = require('../util/help-formatter').formatOption,
    util = require('util'),
    Command = require('./index'),
    inputError = require('../util/input-error'),
    configuration = require('istanbul-api').config;

function InstrumentCommand() {
    Command.call(this);
}

InstrumentCommand.TYPE = 'instrument';
util.inherits(InstrumentCommand, Command);

Command.mix(InstrumentCommand, {
    synopsis: function synopsis() {
        return "instruments a file or a directory tree and writes the instrumented code to the desired output location";
    },

    usage: function () {
        console.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' <options> <file-or-directory>\n\nOptions are:\n\n' +
            [
                formatOption('--config <path-to-config>', 'the configuration file to use, defaults to .istanbul.yml'),
                formatOption('--output <file-or-dir>', 'The output file or directory. This is required when the input is a directory, ' +
                    'defaults to standard output when input is a file'),
                formatOption('-x <exclude-pattern> [-x <exclude-pattern>]', 'one or more fileset patterns (e.g. "**/vendor/**" to ignore all files ' +
                    'under a vendor directory). Also see the --default-excludes option'),
                formatOption('--variable <global-coverage-variable-name>', 'change the variable name of the global coverage variable from the ' +
                    'default value of `__coverage__` to something else'),
                formatOption('--[no-]compact', 'produce [non]compact output, defaults to compact'),
                formatOption('--[no-]preserve-comments', 'remove / preserve comments in the output, defaults to false'),
                formatOption('--[no-]complete-copy', 'also copy non-javascript files to the ouput directory as is, defaults to false'),
                formatOption('--save-baseline', 'produce a baseline coverage.json file out of all files instrumented'),
                formatOption('--baseline-file <file>', 'filename of baseline file, defaults to coverage/coverage-baseline.json'),
                formatOption('--es-modules', 'source code uses es import/export module syntax')
            ].join('\n\n') + '\n');
        console.error('\n');
    },

    run: function (args, callback) {

        var template = {
                config: path,
                output: path,
                x: [Array, String],
                variable: String,
                compact: Boolean,
                'complete-copy': Boolean,
                verbose: Boolean,
                'save-baseline': Boolean,
                'baseline-file': path,
                'preserve-comments': Boolean,
                'es-modules': Boolean
            },
            opts = nopt(template, {v: '--verbose'}, args, 0),
            overrides = {
                verbose: opts.verbose,
                instrumentation: {
                    variable: opts.variable,
                    compact: opts.compact,
                    'preserve-comments': opts['preserve-comments'],
                    excludes: opts.x,
                    'complete-copy': opts['complete-copy'],
                    'save-baseline': opts['save-baseline'],
                    'baseline-file': opts['baseline-file'],
                    'es-modules': opts['es-modules']
                }
            },
            config = configuration.loadFile(opts.config, overrides),
            cmdArgs = opts.argv.remain,
            output = opts.output,
            excludes = opts.x;

        if (cmdArgs.length !== 1) {
            return callback(inputError.create('Need exactly one filename/ dirname argument for the instrument command!'));
        }

        instrument.run(config, { input: cmdArgs[0], output: output, excludes: excludes}, callback);
    }
});

module.exports = InstrumentCommand;

