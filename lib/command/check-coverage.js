/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var nopt = require('nopt'),
    path = require('path'),
    fs = require('fs'),
    Collector = require('../collector'),
    formatOption = require('../util/help-formatter').formatOption,
    util = require('util'),
    utils = require('../object-utils'),
    filesFor = require('../util/file-matcher').filesFor,
    Command = require('./index');

function CheckCoverageCommand() {
    Command.call(this);
}

CheckCoverageCommand.TYPE = 'check-coverage';
util.inherits(CheckCoverageCommand, Command);

Command.mix(CheckCoverageCommand, {
    synopsis: function () {
        return "checks overall coverage against thresholds from coverage JSON files. Exits 1 if thresholds are not met, 0 otherwise";
    },

    usage: function () {
        console.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' <options> [<include-pattern>]\n\nOptions are:\n\n' +
            [
                formatOption('--statements <threshold>', 'statement coverage threshold'),
                formatOption('--functions <threshold>', 'function coverage threshold'),
                formatOption('--branches <threshold>', 'branch coverage threshold'),
                formatOption('--lines <threshold>', 'line coverage threshold')
            ].join('\n\n') + '\n');

        console.error('\n\n');

        console.error('Thresholds, when specified as a positive number are taken to be the minimum percentage required.');
        console.error('When a threshold is specified as a negative number it represents the maximum number of uncovered entities allowed.\n');
        console.error('For example, --statements 90 implies minimum statement coverage is 90%.');
        console.error('             --statements -10 implies that no more than 10 uncovered statements are allowed\n');
        console.error('<include-pattern> is a fileset pattern that can be used to select one or more coverage files ' +
            'for merge. This defaults to "**/coverage*.json"');

        console.error('\n');
    },

    run: function (args, callback) {

        var config = {
                root: path,
                dir: path,
                statements: Number,
                lines: Number,
                branches: Number,
                functions: Number,
                verbose: Boolean
            },
            opts = nopt(config, { v : '--verbose' }, args, 0),
            includePattern = '**/coverage*.json',
            root,
            collector = new Collector(),
            errors = [];

        if (opts.argv.remain.length > 0) {
            includePattern = opts.argv.remain[0];
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
            var thresholds = {
                statements: opts.statements || 0,
                branches: opts.branches || 0,
                lines: opts.lines || 0,
                functions: opts.functions || 0
            },
                actuals = utils.summarizeCoverage(collector.getFinalCoverage());

            if (opts.verbose) {
                console.log('Compare actuals against thresholds');
                console.log(JSON.stringify({ actuals: actuals, thresholds: thresholds }, undefined, 4));
            }

            Object.keys(thresholds).forEach(function (key) {
                var actual = actuals[key].pct,
                    actualUncovered = actuals[key].total - actuals[key].covered,
                    threshold = thresholds[key];

                if (threshold < 0) {
                    if (threshold * -1 < actualUncovered) {
                        errors.push('ERROR: Uncovered count for ' + key + ' (' + actualUncovered + ') exceeds threshold (' + -1 * threshold + ')');
                    }
                } else {
                    if (actual < threshold) {
                        errors.push('ERROR: Coverage for ' + key + ' (' + actual + '%) does not meet threshold (' + threshold + '%)');
                    }
                }
            });
            return callback(errors.length === 0 ? null : errors.join("\n"));
        });
    }
});

module.exports = CheckCoverageCommand;


