/*
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var
    util = require('util'),
    TextReport = require('./text');

/**
 * a `Report` implementation that produces text output in a folder-level detailed table.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('text-folders');
 *
 * @class TextFolderReport
 * @extends TextReport
 * @module report
 * @constructor
 * @param {Object} opts - see TextReport
 */
function TextFolderReport(opts) {
    TextReport.call(this);
}

TextFolderReport.TYPE = 'text-folders';
util.inherits(TextFolderReport, TextReport);

TextReport.super_.mix(TextFolderReport, {

    node_type: 'dir',

    synopsis: function () {
        return 'text report that prints a coverage line for every /folder/, typically to console';
    }
});

module.exports = TextFolderReport;
