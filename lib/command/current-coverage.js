/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var nopt = require('nopt'),
    path = require('path'),
    fs = require('fs'),
    Collector = require('../collector'),
    util = require('util'),
    utils = require('../object-utils'),
    filesFor = require('../util/file-matcher').filesFor,
    Command = require('./index');

var COV_TYPES = [ "statements",
                  "branches",
                  "lines",
                  "functions" ];

function isAbsolute(file) {
    if (path.isAbsolute) {
        return path.isAbsolute(file);
    }

    return path.resolve(file) === path.normalize(file);
}

function CurrentCoverageCommand() {
    Command.call(this);
}

function removeFiles(covObj, root, files) {
    var filesObj = {},
        obj = {};

    // Create lookup table.
    files.forEach(function (file) {
        filesObj[file] = true;
    });

    Object.keys(covObj).forEach(function (key) {
        // Exclude keys will always be relative, but covObj keys can be absolute or relative
        var excludeKey = isAbsolute(key) ? path.relative(root, key) : key;
        // Also normalize for files that start with `./`, etc.
        excludeKey = path.normalize(excludeKey);
        if (filesObj[excludeKey] !== true) {
            obj[key] = covObj[key];
        }
    });

    return obj;
}

CurrentCoverageCommand.TYPE = 'current-coverage';
util.inherits(CurrentCoverageCommand, Command);

Command.mix(CurrentCoverageCommand, {
    synopsis: function () {
        return "shows and optionally checks overall coverage from coverage JSON files.";
    },

    usage: function () {
        console.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' [<include-pattern>]');
        console.error('\n\n');
    },

    run: function (args, callback) {

        var template = {
                root: path,
                baseline: Number,
                verbose: Boolean
            };

        var opts = nopt(template, { v : '--verbose' }, args, 0);

        var baseline = opts.baseline;
        var includePattern = '**/coverage*.json';
        var root;
        var collector = new Collector();
        var errors = [];

        if (opts.argv.remain.length > 0) {
            includePattern = opts.argv.remain[0];
        }

        root = opts.root || process.cwd();
        filesFor({
            root: root,
            includes: [ includePattern ]
        }, function (err, files) {
            if (err) { throw err; }
            if (files.length === 0) {
               return callback('ERROR: No coverage files found.');
            }
            files.forEach(function (file) {
                var coverageObject = JSON.parse(fs.readFileSync(file, 'utf8'));
                collector.add(coverageObject);
            });
            var rawCoverage = collector.getFinalCoverage(),
                globalResults = utils.summarizeCoverage(removeFiles(rawCoverage, root, [])),
                eachResults = removeFiles(rawCoverage, root, []);

            // Summarize per-file results and mutate original results.
            Object.keys(eachResults).forEach(function (key) {
                eachResults[key] = utils.summarizeFileCoverage(eachResults[key]);
            });

            var coverageValuesAry = {};
            COV_TYPES.forEach(function (key) {
                coverageValuesAry[key] = [];
            });

            function processCov(name, actuals) {
                COV_TYPES.forEach(function (key) {
                    var actual = actuals[key].pct;

                    coverageValuesAry[key].push(actual);
                });
            }

            processCov("global", globalResults);

            Object.keys(eachResults).forEach(function (key) {
                processCov("per-file" + " (" + key + ") ", eachResults[key]);
            });

            var coverageAverages = {};
            COV_TYPES.forEach(function (key) {
                var sum = 0;
                coverageValuesAry[key].forEach(function (val) {
                    sum += val;
                });
                var avg = sum / coverageValuesAry[key].length;
                coverageAverages[key] = avg;
            });

            var masterCovSum = 0;
            COV_TYPES.forEach(function (key) {
                masterCovSum += coverageAverages[key];
            });
            var masterCovAverage = Number((masterCovSum / 4).toFixed(2));

            var masterBaseline = baseline || 0;
            if (masterCovAverage < masterBaseline) {
                errors.push('ERROR: Current Coverage (' + masterCovAverage +
                    '%) does not meet baseline threshold (' + masterBaseline + '%)');
            } else {
                console.log(masterCovAverage);
            }

            return callback(errors.length === 0 ? null : errors.join("\n"));
        });
    }
});

module.exports = CurrentCoverageCommand;


