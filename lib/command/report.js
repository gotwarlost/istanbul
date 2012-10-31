/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var nopt = require('nopt'),
    Report = require('../report'),
    path = require('path'),
    fs = require('fs'),
    Collector = require('../collector'),
    inputError = require('../util/input-error'),
    formatOption = require('../util/help-formatter').formatOption,
    filesFor = require('../util/file-matcher').filesFor,
    util = require('util'),
    Command = require('./index');

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
        console.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' <options> [ <format> [<include-pattern>] ]\n\nOptions are:\n\n' +
            [
                formatOption('--root <input-directory>', 'The input root directory for finding coverage files'),
                formatOption('--dir <report-directory>', 'The output directory where files will be written. This defaults to ./coverage/'),
                formatOption('--verbose, -v', 'verbose mode')
            ].join('\n\n') + '\n');

        console.error('\n');

        console.error('<format> is one of html, lcovonly or lcov (html + lcovonly). Default is lcov');
        console.error('<include-pattern> is a fileset pattern that can be used to select one or more coverage files ' +
            'for merged reporting. This defaults to "**/coverage*.json"');

        console.error('\n');
    },

    run: function (args, callback) {

        var config = {
                root: path,
                dir: path,
                verbose: Boolean
            },
            opts = nopt(config, { v : '--verbose' }, args, 0),
            fmtAndArgs = opts.argv.remain,
            fmt = 'lcov',
            includePattern = '**/coverage*.json',
            reporter,
            root,
            collector = new Collector();

        if (fmtAndArgs.length > 0) {
            fmt = fmtAndArgs[0];
        }

        if (fmtAndArgs.length > 1) {
            includePattern = fmtAndArgs[1];
        }

        opts.dir = opts.dir || path.resolve(process.cwd(), 'coverage');

        try {
            reporter = Report.create(fmt, opts);
        } catch (ex) {
            return callback(inputError.create('Invalid report format [' + fmt + ']'));
        }

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
            console.log('Using reporter [' + fmt + ']');
            reporter.writeReport(collector);
            console.log('Done');
            return callback();
        });
    }
});

module.exports = ReportCommand;


