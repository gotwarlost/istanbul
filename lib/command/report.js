/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var nopt = require('nopt'),
    api = require('istanbul-api'),
    reports = api.reports,
    path = require('path'),
    helpFormatter = require('../util/help-formatter'),
    formatOption = helpFormatter.formatOption,
    formatPara = helpFormatter.formatPara,
    util = require('util'),
    Command = require('./index'),
    configuration = require('istanbul-api').config;

function ReportCommand() {
    Command.call(this);
}

ReportCommand.TYPE = 'report';
util.inherits(ReportCommand, Command);

Command.mix(ReportCommand, {
    synopsis: function () {
        return "writes reports for coverage JSON objects produced in a previous run";
    },

    usage: function () {
        console.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' <options> [ <format> ... ]\n\nOptions are:\n\n' +
            [
                formatOption('--config <path-to-config>', 'the configuration file to use, defaults to .istanbul.yml'),
                formatOption('--root <input-directory>', 'The input root directory for finding coverage files'),
                formatOption('--dir <report-directory>', 'The output directory where files will be written. This defaults to ./coverage/'),
                formatOption('--include <glob>', 'The fileset pattern to select one or more coverage files, defaults to **/coverage*.json'),
                formatOption('--verbose, -v', 'verbose mode')
            ].join('\n\n'));

        console.error('\n');
        console.error('<format> is a report name');
        console.error("");
        console.error(formatPara([
            'Default format is lcov unless otherwise specified in the config file.',
            'In addition you can tweak the file names for various reports using the config file.'
        ].join(' ')));
        console.error('\n');
    },

    run: function (args, callback) {

        var template = {
                config: path,
                root: path,
                dir: path,
                include: String,
                verbose: Boolean
            },
            opts = nopt(template, { v : '--verbose' }, args, 0),
            config = configuration.loadFile(opts.config, {
                verbose: opts.verbose,
                reporting: {
                    dir: opts.dir
                }
            }),
            formats = opts.argv.remain;
        reports.run(formats, config, { include: opts.include, root: opts.root }, callback);
    }
});

module.exports = ReportCommand;


