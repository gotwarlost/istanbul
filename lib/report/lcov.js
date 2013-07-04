/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    mkdirp = require('mkdirp'),
    Report = require('./index'),
    LcovOnlyReport = require('./lcovonly'),
    HtmlReport = require('./html');

/**
 * a `Report` implementation that produces an LCOV coverage file and an associated HTML report from coverage objects.
 * The name and behavior of this report is designed to ease migration for projects that currently use `yuitest_coverage`
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('lcov');
 *
 *
 * @class LcovReport
 * @extends Report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to the `lcov.info` file.
 *  HTML files are written in a subdirectory called `lcov-report`. Defaults to `process.cwd()`
 */
function LcovReport(opts) {
    Report.call(this);
    opts = opts || {};
    var baseDir = path.resolve(opts.dir || process.cwd()),
        htmlDir = path.resolve(baseDir, 'lcov-report');

    mkdirp.sync(baseDir);
    this.lcov = new LcovOnlyReport({ dir: baseDir });
    this.html = new HtmlReport({ dir: htmlDir, sourceStore: opts.sourceStore});
}

LcovReport.TYPE = 'lcov';

Report.mix(LcovReport, {
    writeReport: function (collector, sync) {
        this.lcov.writeReport(collector, sync);
        this.html.writeReport(collector, sync);
    }
});

module.exports = LcovReport;
