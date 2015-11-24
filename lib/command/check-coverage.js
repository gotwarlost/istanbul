/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var nopt = require('nopt'),
    path = require('path'),
    formatOption = require('../util/help-formatter').formatOption,
    util = require('util'),
    Command = require('./index'),
    configuration = require('istanbul-api').config,
    checkCoverage = require('istanbul-api').checkCoverage;

function CheckCoverageCommand() {
    Command.call(this);
}

CheckCoverageCommand.TYPE = 'check-coverage';
util.inherits(CheckCoverageCommand, Command);

Command.mix(CheckCoverageCommand, {
    synopsis: function () {
        return "checks overall/per-file coverage against thresholds from coverage JSON files. Exits 1 if thresholds are not met, 0 otherwise";
    },

    usage: function () {
        console.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' <options> [<include-pattern>]\n\nOptions are:\n\n' +
            [
                formatOption('--statements <threshold>', 'global statement coverage threshold'),
                formatOption('--functions <threshold>', 'global function coverage threshold'),
                formatOption('--branches <threshold>', 'global branch coverage threshold'),
                formatOption('--lines <threshold>', 'global line coverage threshold')
            ].join('\n\n') + '\n');

        console.error('\n\n');

        console.error('Thresholds, when specified as a positive number are taken to be the minimum percentage required.');
        console.error('When a threshold is specified as a negative number it represents the maximum number of uncovered entities allowed.\n');
        console.error('For example, --statements 90 implies minimum statement coverage is 90%.');
        console.error('             --statements -10 implies that no more than 10 uncovered statements are allowed\n');
        console.error('Per-file thresholds can be specified via a configuration file.\n');
        console.error('<include-pattern> is a fileset pattern that can be used to select one or more coverage files ' +
            'for merge. This defaults to "**/coverage*.json"');

        console.error('\n');
    },

    run: function (args, callback) {

        var template = {
                config: path,
                root: path,
                statements: Number,
                lines: Number,
                branches: Number,
                functions: Number,
                verbose: Boolean
            },
            opts = nopt(template, { v : '--verbose' }, args, 0),
            // Translate to config opts.
            config = configuration.loadFile(opts.config, {
                verbose: opts.verbose,
                check: {
                    global: {
                        statements: opts.statements,
                        lines: opts.lines,
                        branches: opts.branches,
                        functions: opts.functions
                    }
                }
            }),
            includePattern;

        if (opts.argv.remain.length > 0) {
            includePattern = opts.argv.remain[0];
        }
        checkCoverage.run(config, { root: opts.root, include: includePattern }, callback);
    }
});

module.exports = CheckCoverageCommand;


