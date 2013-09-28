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
 * a `Report` implementation that produces teamcity output for overall coverage in summary format.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('teamcity-summary');
 *
 * @class TeamCitySummaryReport
 * @extends Report
 * @constructor
 */
function TeamCitySummaryReport() {
    Report.call(this);
}

TeamCitySummaryReport.TYPE = 'teamcity-summary';

function lineForKey(summary, key, teamCityKey) {
    var metrics = summary[key];
    if(metrics && metrics.total > 0) {
    return [
        "##teamcity[buildStatisticValue key='"+teamCityKey+"Covered' value='"+metrics.covered+"']",
        "##teamcity[buildStatisticValue key='"+teamCityKey+"Total' value='"+metrics.total+"']"
    ].join('\n');
    } else {
	return '';
    }

    //return [ key , ':', metrics.pct + '%', '(', metrics.covered + '/' + metrics.total, ')'].join(' ');
}

Report.mix(TeamCitySummaryReport, {
    writeReport: function (collector /*, sync */) {
        var summaries = [],
            finalSummary,
            lines = [],
            text;
        collector.files().forEach(function (file) {
            summaries.push(utils.summarizeFileCoverage(collector.fileCoverageFor(file)));
        });
        finalSummary = utils.mergeSummaryObjects.apply(null, summaries);
        lines.push.apply(lines, [
            lineForKey(finalSummary, 'statements', 'CodeCoverageAbsS'),
            lineForKey(finalSummary, 'branches', 'CodeCoverageAbsB'),
            lineForKey(finalSummary, 'functions', 'CodeCoverageAbsM'),
            lineForKey(finalSummary, 'lines', 'CodeCoverageAbsL')
        ]);
        text = lines.join('\n');
        console.log(text);
    }
});

module.exports = TeamCitySummaryReport;
