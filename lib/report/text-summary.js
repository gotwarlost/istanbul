/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    mkdirp = require('mkdirp'),
    fs = require('fs'),
    utils = require('../object-utils'),
    Report = require('./index');

/**
 * a `Report` implementation that produces text output for overall coverage in summary format.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('text-summary');
 *
 * @class TextSummaryReport
 * @extends Report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to the text coverage report will be written, when writing to a file
 * @param {String} [opts.file] the filename for the report. When omitted, the report is written to console
 */
function TextSummaryReport(opts) {
    Report.call(this);
    opts = opts || {};
    this.dir = opts.dir || process.cwd();
    this.file = opts.file;
}

TextSummaryReport.TYPE = 'text-summary';

function lineForKey(summary, key) {
    var metrics = summary[key];
    key = key.substring(0, 1).toUpperCase() + key.substring(1);
    if (key.length < 12) { key += '                   '.substring(0, 12 - key.length); }
    return [ key , ':', metrics.pct + '%', '(', metrics.covered + '/' + metrics.total, ')'].join(' ');
}

Report.mix(TextSummaryReport, {
    writeReport: function (collector /*, sync */) {
        var summaries = [],
            finalSummary,
            lines = [],
            text;
        collector.files().forEach(function (file) {
            summaries.push(utils.summarizeFileCoverage(collector.fileCoverageFor(file)));
        });
        finalSummary = utils.mergeSummaryObjects.apply(null, summaries);
        lines.push('');
        lines.push('=============================== Coverage summary ===============================');
        lines.push.apply(lines, [
            lineForKey(finalSummary, 'statements'),
            lineForKey(finalSummary, 'branches'),
            lineForKey(finalSummary, 'functions'),
            lineForKey(finalSummary, 'lines')
        ]);
        lines.push('================================================================================');
        text = lines.join('\n');
        if (this.file) {
            mkdirp.sync(this.dir);
            fs.writeFileSync(path.join(this.dir, this.file), text, 'utf8');
        } else {
            console.log(text);
        }
    }
});

module.exports = TextSummaryReport;
