/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*jslint nomen: true */
var handlebars = require('handlebars'),
    path = require('path'),
    SEP = path.sep || '/',
    fs = require('fs'),
    util = require('util'),
    mkdirp = require('mkdirp'),
    FileWriter = require('../util/file-writer'),
    Report = require('./index'),
    Store = require('../store'),
    InsertionText = require('../util/insertion-text'),
    TreeSummarizer = require('../util/tree-summarizer'),
    utils = require('../object-utils'),
    templateFor = function (name) { return handlebars.compile(fs.readFileSync(path.resolve(__dirname, 'templates', name + '.txt'), 'utf8')); },
    headerTemplate = templateFor('head'),
    footerTemplate = templateFor('foot'),
    pathTemplate = handlebars.compile('<div class="path">{{{html}}}</div>'),
    detailTemplate = handlebars.compile([
        '<tr>',
        '<td class="line-count">{{line}}</td>',
        '<td class="line-coverage cline-{{covered}}">{{executionCount}}</td>',
        '<td class="text">{{{text}}}</td>',
        '</tr>\n'
    ].join('\n\t')),
    summaryTableHeader = [
        '<div class="coverage-summary">',
        '<table>',
        '<thead>',
        '<tr>',
        '   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>',
        '   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>',
        '   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>',
        '   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>',
        '   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>',
        '   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>',
        '   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>',
        '   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>',
        '   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>',
        '   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>',
        '</tr>',
        '</thead>',
        '<tbody>'
    ].join('\n'),
    summaryLineTemplate = handlebars.compile([
        '<tr>',
        '<td class="file {{reportClasses.statements}}" data-value="{{file}}"><a href="{{output}}">{{file}}</a></td>',
        '<td data-value="{{metrics.statements.pct}}" class="pic {{reportClasses.statements}}">{{#picture}}{{metrics.statements.pct}}{{/picture}}</td>',
        '<td data-value="{{metrics.statements.pct}}" class="pct {{reportClasses.statements}}">{{metrics.statements.pct}}%</td>',
        '<td data-value="{{metrics.statements.total}}" class="abs {{reportClasses.statements}}">({{metrics.statements.covered}} / {{metrics.statements.total}})</td>',
        '<td data-value="{{metrics.branches.pct}}" class="pct {{reportClasses.branches}}">{{metrics.branches.pct}}%</td>',
        '<td data-value="{{metrics.branches.total}}" class="abs {{reportClasses.branches}}">({{metrics.branches.covered}} / {{metrics.branches.total}})</td>',
        '<td data-value="{{metrics.functions.pct}}" class="pct {{reportClasses.functions}}">{{metrics.functions.pct}}%</td>',
        '<td data-value="{{metrics.functions.total}}" class="abs {{reportClasses.functions}}">({{metrics.functions.covered}} / {{metrics.functions.total}})</td>',
        '<td data-value="{{metrics.lines.pct}}" class="pct {{reportClasses.lines}}">{{metrics.lines.pct}}%</td>',
        '<td data-value="{{metrics.lines.total}}" class="abs {{reportClasses.lines}}">({{metrics.lines.covered}} / {{metrics.lines.total}})</td>',
        '</tr>\n'
    ].join('\n\t')),
    summaryTableFooter = [
        '</tbody>',
        '</table>',
        '</div>'
    ].join('\n'),
    seq = 0,
    lt = '\u0001',
    gt = '\u0002',
    RE_LT = /</g,
    RE_GT = />/g,
    RE_AMP = /&/g,
    RE_lt = /\u0001/g,
    RE_gt = /\u0002/g;

handlebars.registerHelper('picture', function (opts) {
    var num = Number(opts.fn(this)),
        rest,
        cls = '';
    if (isFinite(num)) {
        if (num === 100) {
            cls = ' cover-full';
        }
        num = Math.floor(num);
        rest = 100 - num;
        return '<span class="cover-fill' + cls + '" style="width: ' + num + 'px;"></span>'
            + '<span class="cover-empty" style="width:' + rest + 'px;"></span>';
    } else {
        return '';
    }
});

function annotateLines(fileCoverage, structuredText) {
    var lineStats = fileCoverage.l;
    if (!lineStats) { return; }
    Object.keys(lineStats).forEach(function (lineNumber) {
        var count = lineStats[lineNumber];
        structuredText[lineNumber].covered = count > 0 ? 'yes' : 'no';
    });
    structuredText.forEach(function (item) {
        if (item.covered === null) {
            item.covered = 'neutral';
        }
    });
}

function annotateStatements(fileCoverage, structuredText) {
    var statementStats = fileCoverage.s,
        statementMeta = fileCoverage.statementMap;
    Object.keys(statementStats).forEach(function (stName) {
        var count = statementStats[stName],
            meta = statementMeta[stName],
            type = count > 0 ? 'yes' : 'no',
            startCol = meta.start.column,
            endCol = meta.end.column + 1,
            startLine = meta.start.line,
            endLine = meta.end.line,
            openSpan = lt + 'span class="cstat-' + type + '"' + gt,
            closeSpan = lt + '/span' + gt,
            text;

        if (type === 'no') {
            if (endLine !== startLine) {
                endLine = startLine;
                endCol = structuredText[startLine].text.originalLength();
            }
            text = structuredText[startLine].text;
            text.wrap(startCol,
                openSpan,
                startLine === endLine ? endCol : text.originalLength(),
                closeSpan);
        }
    });
}

function annotateFunctions(fileCoverage, structuredText) {

    var fnStats = fileCoverage.f,
        fnMeta = fileCoverage.fnMap;
    if (!fnStats) { return; }
    Object.keys(fnStats).forEach(function (fName) {
        var count = fnStats[fName],
            meta = fnMeta[fName],
            type = count > 0 ? 'yes' : 'no',
            startCol = meta.loc.start.column,
            endCol = meta.loc.end.column + 1,
            startLine = meta.loc.start.line,
            endLine = meta.loc.end.line,
            openSpan = lt + 'span class="fstat-' + type + '"' + gt,
            closeSpan = lt + '/span' + gt,
            text;

        if (type === 'no') {
            if (endLine !== startLine) {
                endLine = startLine;
                endCol = structuredText[startLine].text.originalLength();
            }
            text = structuredText[startLine].text;
            text.wrap(startCol,
                openSpan,
                startLine === endLine ? endCol : text.originalLength(),
                closeSpan);
        }
    });
}

function annotateBranches(fileCoverage, structuredText) {
    var branchStats = fileCoverage.b,
        branchMeta = fileCoverage.branchMap;
    if (!branchStats) { return; }

    Object.keys(branchStats).forEach(function (branchName) {
        var branchArray = branchStats[branchName],
            sumCount = branchArray.reduce(function (p, n) { return p + n; }, 0),
            metaArray = branchMeta[branchName].locations,
            i,
            count,
            meta,
            type,
            startCol,
            endCol,
            startLine,
            endLine,
            openSpan,
            closeSpan,
            text;

        if (sumCount > 0) { //only highlight if partial branches are missing
            for (i = 0; i < branchArray.length; i += 1) {
                count = branchArray[i];
                meta = metaArray[i];
                type = count > 0 ? 'yes' : 'no';
                startCol = meta.start.column;
                endCol = meta.end.column + 1;
                startLine = meta.start.line;
                endLine = meta.end.line;
                openSpan = lt + 'span class="branch-' + i + ' cbranch-' + type + '"' + gt;
                closeSpan = lt + '/span' + gt;

                if (count === 0) { //skip branches taken
                    if (endLine !== startLine) {
                        endLine = startLine;
                        endCol = structuredText[startLine].text.originalLength();
                    }
                    text = structuredText[startLine].text;
                    if (branchMeta[branchName].type === 'if') { // and 'if' is a special case since the else branch might not be visible, being non-existent
                        text.insertAt(startCol, lt + 'span class="missing-if-branch"' + gt + (i === 0 ? 'I' : 'E')  + lt + '/span' + gt, true, false);
                    } else {
                        text.wrap(startCol,
                            openSpan,
                            startLine === endLine ? endCol : text.originalLength(),
                            closeSpan);
                    }
                }
            }
        }
    });
}

function customEscape(text) {
    text = text.toString();
    return text.replace(RE_AMP, '&amp;')
        .replace(RE_LT, '&lt;')
        .replace(RE_GT, '&gt;')
        .replace(RE_lt, '<')
        .replace(RE_gt, '>');
}

function getReportClass(stats) {
    var coveragePct = stats.pct,
        identity  = 1;
    if (coveragePct * identity === coveragePct) {
        return coveragePct >= 80 ? 'high' : coveragePct >= 50 ? 'medium' : 'low';
    } else {
        return '';
    }
}

/**
 * a `Report` implementation that produces HTML coverage reports.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('html');
 *
 *
 * @class HtmlReport
 * @extends Report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to generate reports. Defaults to `./html-report`
 */
function HtmlReport(opts) {
    Report.call(this);
    this.opts = opts || {};
    this.opts.dir = this.opts.dir || path.resolve(process.cwd(), 'html-report');
    this.opts.sourceStore = this.opts.sourceStore || Store.create('fslookup');
}

HtmlReport.TYPE = 'html';
util.inherits(HtmlReport, Report);

Report.mix(HtmlReport, {

    getPathHtml: function (node, linkMapper) {
        var parent = node.parent,
            nodePath = [],
            linkPath = [],
            i;

        while (parent) {
            nodePath.push(parent);
            parent = parent.parent;
        }

        for (i = 0; i < nodePath.length; i += 1) {
            linkPath.push('<a href="' + linkMapper.ancestor(node, i + 1) + '">'
                + (nodePath[i].relativeName || 'All files') + '</a>');
        }
        linkPath.reverse();
        return linkPath.length > 0 ? linkPath.join(' &#187; ') + ' &#187; '
            + node.displayShortName() : '';
    },

    writeDetailPage: function (writer, node, linkMapper, templateData, fileCoverage, metrics) {
        var opts = this.opts,
            sourceStore = opts.sourceStore,
            sourceText = fileCoverage.code && Array.isArray(fileCoverage.code) ?
                fileCoverage.code.join('\n') + '\n' : sourceStore.get(fileCoverage.path),
            code = sourceText.split(/\r?\n/),
            count = 0,
            structured = code.map(function (str) { count += 1; return { line: count, covered: null, text: new InsertionText(str, true) }; }),
            lineNum = 0;

        structured.unshift({ line: 0, covered: null, text: new InsertionText("") });

        templateData.metrics = metrics;
        templateData.reportClass = getReportClass(templateData.metrics.statements);
        templateData.pathHtml = pathTemplate({ html: this.getPathHtml(node, linkMapper) });
        writer.write(headerTemplate(templateData));
        writer.write('<pre><table class="coverage">\n');

        annotateLines(fileCoverage, structured);
        //note: order is important, since statements typically result in spanning the whole line and doing branches late
        //causes mismatched tags
        annotateBranches(fileCoverage, structured);
        annotateFunctions(fileCoverage, structured);
        annotateStatements(fileCoverage, structured);

        structured.shift();
        structured.forEach(function (item) {
            lineNum += 1;
            item.executionCount = fileCoverage.l ? fileCoverage.l[lineNum] || null : null;
            item.text = customEscape(item.text);
            writer.write(detailTemplate(item));
        });
        writer.write('</table></pre>\n');
        writer.write(footerTemplate(templateData));
    },

    writeIndexPage: function (writer, node, linkMapper, templateData) {
        var children = Array.prototype.slice.apply(node.children);

        children.sort(function (a, b) {
            return a.name < b.name ? -1 : 1;
        });

        templateData.metrics = node.metrics;
        templateData.reportClass = getReportClass(node.metrics.statements);
        templateData.pathHtml = pathTemplate({ html: this.getPathHtml(node, linkMapper) });

        writer.write(headerTemplate(templateData));
        writer.write(summaryTableHeader);
        children.forEach(function (child) {
            var metrics = child.metrics,
                reportClasses = {
                    statements: getReportClass(metrics.statements),
                    lines: getReportClass(metrics.lines),
                    functions: getReportClass(metrics.functions),
                    branches: getReportClass(metrics.branches)
                },
                data = {
                    metrics: metrics,
                    reportClasses: reportClasses,
                    file: child.displayShortName(),
                    output: linkMapper.fromParent(child)
                };
            writer.write(summaryLineTemplate(data) + '\n');
        });
        writer.write(summaryTableFooter);
        writer.write(footerTemplate(templateData));
    },

    writeFiles: function (writer, node, dir, linkMapper, templateData, collector) {
        var that = this,
            indexFile = path.resolve(dir, 'index.html'),
            childFile;
        mkdirp.sync(dir);
        templateData.entity = node.name || 'All files';
        if (this.opts.verbose) { console.error('Writing ' + indexFile); }
        writer.writeFile(indexFile, function () {
            that.writeIndexPage(writer, node, linkMapper, templateData);
        });
        node.children.forEach(function (child) {
            if (child.kind === 'dir') {
                that.writeFiles(writer, child, path.resolve(dir, child.relativeName), linkMapper, templateData, collector);
            } else {
                childFile = path.resolve(dir, child.relativeName + '.html');
                if (that.opts.verbose) { console.error('Writing ' + childFile); }
                templateData.entity = child.name;
                writer.writeFile(childFile, function () {
                    that.writeDetailPage(writer, child, linkMapper, templateData, collector.fileCoverageFor(child.fullPath()), child.metrics);
                });
            }
        });
    },

    writeReport: function (collector, sync) {
        var opts = this.opts,
            dir = opts.dir,
            dt = new Date().toString(),
            summarizer = new TreeSummarizer(),
            linkMapper = {
                fromParent: function (node) {
                    var i = 0,
                        relativeName = node.relativeName,
                        ch;
                    if (SEP !== '/') {
                        relativeName = '';
                        for (i = 0; i < node.relativeName.length; i += 1) {
                            ch = node.relativeName.charAt(i);
                            if (ch === SEP) {
                                relativeName += '/';
                            } else {
                                relativeName += ch;
                            }
                        }
                    }
                    return node.kind === 'dir' ? relativeName + 'index.html' : relativeName + '.html';
                },
                ancestor: function (node, num) {
                    var href = '',
                        separated,
                        levels,
                        i,
                        j;
                    for (i = 0; i < num; i += 1) {
                        separated = node.relativeName.split(SEP);
                        levels = separated.length - 1;
                        for (j = 0; j < levels; j += 1) {
                            href += '../';
                        }
                        node = node.parent;
                    }
                    return href + 'index.html';
                }
            },
            writer = new FileWriter(sync),
            tree;

        collector.files().forEach(function (key) {
            summarizer.addFileCoverageSummary(key, utils.summarizeFileCoverage(collector.fileCoverageFor(key)));
        });
        tree = summarizer.getTreeSummary();
        //console.log(JSON.stringify(tree.root, undefined, 4));
        this.writeFiles(writer, tree.root, dir, linkMapper, { datetime: dt }, collector);
    }
});

module.exports = HtmlReport;

