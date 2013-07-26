/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    mkdirp = require('mkdirp'),
    fs = require('fs'),
    Report = require('./index'),
    TreeSummarizer = require('../util/tree-summarizer'),
    utils = require('../object-utils'),
    PCT_COLS = 10,
    TAB_SIZE = 3,
    DELIM = ' |',
    COL_DELIM = '-+';

/**
 * a `Report` implementation that produces text output in a detailed table.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('text');
 *
 * @class TextReport
 * @extends Report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to the text coverage report will be written, when writing to a file
 * @param {String} [opts.file] the filename for the report. When omitted, the report is written to console
 * @param {Number} [opts.maxcols] the max column width of the report. By default, the width of the report is adjusted based on the length of the paths
 *              to be reported.
 */
function TextReport(opts) {
    Report.call(this);
    opts = opts || {};
    this.dir = opts.dir || process.cwd();
    this.file = opts.file;
    this.summary = opts.summary;
    this.maxCols = opts.maxCols || 0;
}

TextReport.TYPE = 'text';

function padding(num, ch) {
    var str = '',
        i;
    ch = ch || ' ';
    for (i = 0; i < num; i += 1) {
        str += ch;
    }
    return str;
}

function fill(str, width, right, tabs) {
    tabs = tabs || 0;
    str = String(str);

    var leadingSpaces = tabs * TAB_SIZE,
        remaining = width - leadingSpaces,
        leader = padding(leadingSpaces),
        fmtStr = '',
        fillStr,
        isNumber = !isNaN(parseFloat(str)) && isFinite(str),
        strlen = str.length,
        isTty = Boolean(process.stdout.isTTY);

    if (isNumber && isTty) {
        // low: < 50 % medium: >= 50 % high: >= 80 %
        if (str >= 80) {
            str = '\033[92m' + str + '\033[0m'; // high - green
        } else if (str >= 50) {
            str = '\033[93m' + str + '\033[0m'; // medium - yellow
        } else {
            str = '\033[91m' + str + '\033[0m'; // low - red
        }
    }

    if (remaining > 0) {
        if (remaining >= strlen) {
            fillStr = padding(remaining - strlen);
            fmtStr = right ? fillStr + str : str + fillStr;
        } else {
            fmtStr = str.substring(strlen - remaining);
            fmtStr = '... ' + fmtStr.substring(4);
        }
    }
    return leader + fmtStr;
}

function formatName(name, maxCols, level) {
    return fill(name, maxCols, false, level);
}

function formatPct(pct) {
    return fill(pct, PCT_COLS, true, 0);
}

function nodeName(node) {
    return node.displayShortName() || 'All files';
}

function tableHeader(maxNameCols) {
    var elements = [];
    elements.push(formatName('File', maxNameCols, 0));
    elements.push(formatPct('% Stmts'));
    elements.push(formatPct('% Branches'));
    elements.push(formatPct('% Funcs'));
    elements.push(formatPct('% Lines'));
    return elements.join(' |') + ' |';
}

function tableRow(node, maxNameCols, level) {
    var name = nodeName(node),
        statements = node.metrics.statements.pct,
        branches = node.metrics.branches.pct,
        functions = node.metrics.functions.pct,
        lines = node.metrics.lines.pct,
        elements = [];

    elements.push(formatName(name, maxNameCols, level));
    elements.push(formatPct(statements));
    elements.push(formatPct(branches));
    elements.push(formatPct(functions));
    elements.push(formatPct(lines));

    return elements.join(DELIM) + DELIM;
}

function findNameWidth(node, level, last) {
    last = last || 0;
    level = level || 0;
    var idealWidth = TAB_SIZE * level + nodeName(node).length;
    if (idealWidth > last) {
        last = idealWidth;
    }
    node.children.forEach(function (child) {
        last = findNameWidth(child, level + 1, last);
    });
    return last;
}

function makeLine(nameWidth) {
    var name = padding(nameWidth, '-'),
        pct = padding(PCT_COLS, '-'),
        elements = [];

    elements.push(name);
    elements.push(pct);
    elements.push(pct);
    elements.push(pct);
    elements.push(pct);
    return elements.join(COL_DELIM) + COL_DELIM;
}

function walk(node, nameWidth, array, level) {
    var line;
    if (level === 0) {
        line = makeLine(nameWidth);
        array.push(line);
        array.push(tableHeader(nameWidth));
        array.push(line);
    } else {
        array.push(tableRow(node, nameWidth, level));
    }
    node.children.forEach(function (child) {
        walk(child, nameWidth, array, level + 1);
    });
    if (level === 0) {
        array.push(line);
        array.push(tableRow(node, nameWidth, level));
        array.push(line);
    }
}

Report.mix(TextReport, {
    writeReport: function (collector /*, sync */) {
        var summarizer = new TreeSummarizer(),
            tree,
            root,
            nameWidth,
            statsWidth = 4 * ( PCT_COLS + 2),
            maxRemaining,
            strings = [],
            text;

        collector.files().forEach(function (key) {
            summarizer.addFileCoverageSummary(key, utils.summarizeFileCoverage(collector.fileCoverageFor(key)));
        });
        tree = summarizer.getTreeSummary();
        root = tree.root;
        nameWidth = findNameWidth(root);
        if (this.maxCols > 0) {
            maxRemaining = this.maxCols - statsWidth - 2;
            if (nameWidth > maxRemaining) {
                nameWidth = maxRemaining;
            }
        }
        walk(root, nameWidth, strings, 0);
        text = strings.join('\n') + '\n';
        if (this.file) {
            mkdirp.sync(this.dir);
            fs.writeFileSync(path.join(this.dir, this.file), text, 'utf8');
        } else {
            console.log(text);
        }
    }
});

module.exports = TextReport;
