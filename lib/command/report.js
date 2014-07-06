/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var nopt = require('nopt'),
    Report = require('../report'),
    Reporter = require('./common/reporter'),
    path = require('path'),
    fs = require('fs'),
    Collector = require('../collector'),
    inputError = require('../util/input-error'),
    formatOption = require('../util/help-formatter').formatOption,
    filesFor = require('../util/file-matcher').filesFor,
    util = require('util'),
    Command = require('./index'),
    configuration = require('../configuration');

function ReportCommand() {
    Command.call(this);
}

ReportCommand.TYPE = 'report';
util.inherits(ReportCommand, Command);

function printDeprecationMessage(pat, fmt) {
    console.error('**********************************************************************');
    console.error('DEPRECATION WARNING! You are probably using the old format of the report command');
    console.error('This will stop working soon, see `istanbul help report` for the new command format');
    console.error('Assuming you meant: istanbul report --include=' + pat + ' ' + fmt);
    console.error('**********************************************************************');
}

Command.mix(ReportCommand, {
    synopsis: function () {
        return "writes reports for coverage JSON objects produced in a previous run";
    },

    usage: function () {
        console.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' <options> [ <format> [ <format> ... ] ] ]\n\nOptions are:\n\n' +
            [
                formatOption('--config <path-to-config>', 'the configuration file to use, defaults to .istanbul.yml'),
                formatOption('--root <input-directory>', 'The input root directory for finding coverage files'),
                formatOption('--dir <report-directory>', 'The output directory where files will be written. This defaults to ./coverage/'),
                formatOption('--include <glob>', 'The fileset pattern to select one or more coverage files, defaults to **/coverage*.json'),
                formatOption('--verbose, -v', 'verbose mode')
            ].join('\n\n') + '\n');

        console.error('\n');
        console.error('<format> is one of ' + Report.getReportList().join(', ') + '. Default is lcov');
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
            includePattern = opts.include || '**/coverage*.json',
            root,
            collector = new Collector(),
            config = configuration.loadFile(opts.config, {
                verbose: opts.verbose,
                reporting: {
                    dir: opts.dir
                }
            }),
            reportOpts = {
                verbose: config.verbose,
                dir: config.reporting.dir(),
                watermarks: config.reporting.watermarks()
            },
            formats = opts.argv.remain,
            reporter = new Reporter();

        // Start: backward compatible processing
        if (formats.length === 2 &&
                Report.getReportList().indexOf(formats[1]) < 0) {
            includePattern = formats[1];
            formats = [ formats[0] ];
            printDeprecationMessage(includePattern, formats[0]);
        }
        // End: backward compatible processing

        if (formats.length === 0) {
            formats = config.reporting.reports();
        }
        if (formats.length === 0) {
            formats = [ 'lcov' ];
        }
        formats.forEach(function (f) {
            try {
                reporter.add(f, reportOpts);
            } catch (ex) {
                return callback(inputError.create('Invalid report format [' + f + ']'));
            }
        });

        root = opts.root || process.cwd();
        filesFor({
            root: root,
            includes: [ includePattern ]
        }, function (err, files) {
            if (err) { throw err; }
            files.forEach(function (file) {
                var coverageObject =  JSON.parse(fs.readFileSync(file, 'utf8'));
                collector.add(coverageObject);
            });
            reporter.write(collector, false);
            console.log('Done');
            return callback();
        });
    }
});

module.exports = ReportCommand;


