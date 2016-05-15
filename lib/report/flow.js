/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*jshint maxlen: 300 */
var handlebars = require('handlebars').create(),
    defaults = require('./common/defaults'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    FileWriter = require('../util/file-writer'),
    Report = require('./index'),
    Store = require('../store'),
    InsertionText = require('../util/insertion-text'),
    TreeSummarizer = require('../util/tree-summarizer'),
    utils = require('../object-utils');

function templateFor(name) {
    var templatesPath = path.resolve(__dirname, 'templates', name + '.txt');

    return handlebars.compile(fs.readFileSync(templatesPath, 'utf8'));
}

var headerTemplate = templateFor('head-flow'),
    footerTemplate = templateFor('foot-flow'),

    detailTemplate = handlebars.compile(
        '<tr>\n' +
        '<td class="line-number">{{#line_numbers maxLines}}{{/line_numbers}}</td>\n' +
        '<td class="line-coverage">{{#line_execution_counts maxLines fileCoverage structuredText}}{{/line_execution_counts}}</td>\n' +
        '<td class="text"><pre class="prettyprint lang-js">{{#code structuredText}}{{/code}}</pre></td>\n' +
        '</tr>\n'
    ),

    navTemplate = handlebars.compile(
        '<nav>\n' +
        '<span class="empty-placeholder">No uncovered items</span>' +
        '<ul>\n' +
        '{{#each items}}<li data-target="{{id}}"><input type="checkbox" /><span>{{line}}&nbsp;&nbsp;{{text}}</span></li>\n{{/each}}\n' +
        '</ul>\n' +
        '</nav>\n'
    ),

    summaryTableHeader =
        '<section class="summary">\n' +
        '<table>\n' +
        '<thead>\n' +
        '<tr>\n' +
        '<th data-col="file" data-fmt="html" data-html="true" class="file">File</th>\n' +
        '<th data-col="statements">Statements</th>\n' +
        '<th data-col="branches">Branches</th>\n' +
        '<th data-col="functions">Functions</th>\n' +
        '</tr>\n' +
        '</thead>\n' +
        '<tbody>\n',

    summaryLineTemplate = handlebars.compile(
        '<tr>\n' +
        '<td class="file"><a href="{{fileHref}}">{{file}}</a></td>\n' +
        '<td class="statements {{metrics.statements.class}}" title="{{metrics.statements.stats}}" data-uncovered="{{metrics.statements.uncovered}}">' +
            '<svg><use xlink:href="#checkmark"></use></svg>' +
        '</td>\n' +
        '<td class="branches {{metrics.branches.class}}" title="{{metrics.branches.stats}}" data-uncovered="{{metrics.branches.uncovered}}">' +
            '<svg><use xlink:href="#checkmark"></use></svg>' +
        '</td>\n' +
        '<td class="functions {{metrics.functions.class}}" title="{{metrics.functions.stats}}" data-uncovered="{{metrics.functions.uncovered}}">' +
            '<svg><use xlink:href="#checkmark"></use></svg>' +
        '</td>\n' +
        '</tr>\n'
    ),

    summaryTableFooter =
        '</tbody>\n' +
        '</table>\n' +
        '</section>\n',

    metricsTypes = ['statements', 'functions', 'branches'],
    timestamp = Date.now(),

    lt = '\u0001',
    gt = '\u0002',
    RE_LT = /</g,
    RE_GT = />/g,
    RE_AMP = /&/g,
    RE_lt = /\u0001/g,
    RE_gt = /\u0002/g;

function formatLineNumbers(maxLines) {
    var result = '';

    for (var i = 1; i <= maxLines; i++) {
        result += '<span data-line="' + i + '"></span>\n';
    }

    return result;
}

handlebars.registerHelper('line_numbers', formatLineNumbers);

function formatExecutionCounts(maxLines, fileCoverage, structuredText) {
    var lines = fileCoverage.l,
        result = '';

    for (var i = 0; i < maxLines; i++) {
        var lineNumber = String(i + 1),
            value = '&nbsp;',
            covered = '',
            textItem;

        if (lines.hasOwnProperty(lineNumber)) {
            if (lines[lineNumber] > 0) {
                // A line with an uncovered branch marks its item in structuredText as partially covered
                textItem = structuredText['' + i];
                covered = textItem ? textItem.covered : 'covered';
                value = lines[lineNumber] + '×';
            } else {
                covered = 'uncovered';
            }
        } else {
            // An unused function marks its item in structuredText as not covered
            textItem = structuredText['' + i];

            if (textItem) {
                covered = textItem.covered;
            }
        }

        result += '<span class="' + covered + '">' + value + '</span>\n';
    }

    return result;
}

handlebars.registerHelper('line_execution_counts', formatExecutionCounts);

function customEscape(text) {
    text = text.toString();

    return text.replace(RE_AMP, '&amp;')
        .replace(RE_LT, '&lt;')
        .replace(RE_GT, '&gt;')
        .replace(RE_lt, '<')
        .replace(RE_gt, '>');
}

function formatCode(structuredText) {
    var code = '';

    structuredText.forEach(function (item) {
        code += (customEscape(item.text) || '&nbsp;') + '\n';
    });

    return code;
}

handlebars.registerHelper('code', formatCode);

function writeNav(writer, structuredText) {
    var re = /\bid="(.+?)" .+?title="(.+?)"/g,
        items = [];

    structuredText.forEach(function (item) {
        if (item.covered === 'uncovered' || item.covered === 'partial') {
            // Extract ids and titles
            re.lastIndex = 0;

            var text = item.text.text,
                match;

            while (match = re.exec(text)) {
               items.push({
                   line: item.line,
                   id: match[1],
                   text: match[2]
               });
            }
        }
    });

    writer.write(navTemplate({ items: items }));
}

function title(str) {
    return ' title="' + str + '" ';
}

function annotateLines(fileCoverage, structuredText) {
    var lineStats = fileCoverage.l;

    if (!lineStats) {
        return;
    }

    Object.keys(lineStats).forEach(function (lineNumber) {
        var count = lineStats[lineNumber];

        if (structuredText[lineNumber]) {
          structuredText[lineNumber].covered = count > 0 ? 'covered' : 'uncovered';
        }
    });

    structuredText.forEach(function (item) {
        if (item.covered === null) {
            item.covered = '';
        }
    });
}

function annotate(type, fileCoverage, structuredText) {
    var stats,
        map;

    if (type === 'statement') {
        stats = fileCoverage.s;
        map = fileCoverage.statementMap;
    } else {
        stats = fileCoverage.f;
        map = fileCoverage.fnMap;
    }

    if (!stats) {
        return;
    }

    // There may be multiple statements on a line, so we add a sequence number to the id
    var sequenceNumber = 0;

    Object.keys(stats).forEach(function (name) {
        var count = stats[name],
            meta = map[name],
            covered;

        if (meta.skip) {
            covered = 'ignored';
        } else {
            if (count > 0) {
                return;
            }

            covered = 'uncovered';
        }

        sequenceNumber++;

        var loc = type === 'statement' ? meta : meta.loc,
            endCol = loc.end.column + 1,
            startLine = loc.start.line,
            endLine = loc.end.line,
            id = type + '-' + startLine + '-' + sequenceNumber,
            itemClass = 'statement ' + (meta.skip ? 'ignored' : covered),
            openSpan = lt + 'mark id="' + id + '" class="' + itemClass + '"' + title(type + ' not covered') + gt,
            closeSpan = lt + '/mark' + gt,
            textItem = structuredText[startLine],
            text = textItem.text;

        // Only highlight the first line of a multi-line statement
        if (endLine !== startLine) {
            endCol = text.originalLength();
        }

        // If the next statement starts on the same line, end this one at the start of the next one
        var nextName = String(Number(name) + 1),
            nextMeta = map[nextName],
            nextLoc = type === 'statement' ? nextMeta : nextMeta.loc,
            nextStartLine = nextLoc.start.line;

        if (nextStartLine === startLine) {
            endCol = nextLoc.start.column;
        }

        text.insertAt(
            // We use text.startPos instead of loc.start.column for functions
            // because the latter doesn't include the method name in a class.
            type === 'function' ? text.startPos : loc.start.column,
            openSpan,

            // Insert *after* the start pos to ensure we go after a previous
            // mark on the same line.
            false
        );

        text.insertAt(endCol, closeSpan, false);

        // Set the covered property so that functions are marked as uncovered/ignored
        textItem.covered = covered;
    });
}

function annotateBranches(fileCoverage, metrics, structuredText) {
    var branchStats = fileCoverage.b,
        branchMap = fileCoverage.branchMap;

    if (!branchStats) {
        return;
    }

    // There may be multiple statements on a line, so we add a sequence number to the id
    var sequenceNumber = 0;

    Object.keys(branchStats).forEach(function (branchName) {
        var branchArray = branchStats[branchName],
            metaArray = branchMap[branchName].locations;

        for (var i = 0; i < branchArray.length; i++) {
            var executionCount = branchArray[i],
                meta = metaArray[i];

            if (executionCount > 0)
                continue;

            sequenceNumber++;

            var startCol = meta.start.column,
                endCol = meta.end.column + 1,
                startLine = meta.start.line,
                endLine = meta.end.line,
                what = meta.skip ? 'ignored' : 'not covered',
                id = meta.skip ? '' : startLine + '-' + sequenceNumber,
                textItem = structuredText[startLine];

            // If the branch is being skipped and the line was not previously marked
            // as uncovered, mark it as skipped.
            if (meta.skip) {
                if (textItem.covered !== 'uncovered')
                    textItem.covered = 'ignored';
            } else {
                textItem.covered =  'partial';
            }

            if (endLine !== startLine) {
                endLine = startLine;
                endCol = textItem.text.originalLength();
            }

            var text = textItem.text;

            // 'if' is a special case since the else branch might not be visible, being non-existent
            if (branchMap[branchName].type === 'if') {
                var cssClass = meta.skip ? 'ignored' : 'uncovered',
                    missingPath = i === 0 ? 'if' : 'else',
                    titleAttr = title(missingPath + ' path ' + (meta.skip ? 'ignored' : 'not taken'));

                text.insertAt(
                    startCol,
                    lt + 'mark id="path-' + id + '" class="path ' + cssClass + ' ' + missingPath + '" ' + titleAttr + gt + lt + '/mark' + gt,
                    i === 0,
                    false
                );

                // After inserting, make sure subsequent insertions on the same line go after
                // the one that was just done.
                var offsets = text.offsets[text.offsets.length - 1];

                startCol = offsets.pos + offsets.len;
            } else {
                var markClass = 'branch ' + (meta.skip ? 'ignored' : 'uncovered'),
                    openMark = lt + 'mark id="branch-' + id + '" class="' + markClass + '"' + title('branch ' + what) + gt,
                    closeMark = lt + '/mark' + gt;

                text.wrap(
                    startCol,
                    openMark,
                    startLine === endLine ? endCol : text.originalLength(),
                    closeMark
                );
            }
        }
    });

    metrics.uncovered = metrics.total - metrics.covered;
}

function cleanPath(name) {
    var sep = path.sep || '/';

    return (sep !== '/') ? name.split(sep).join('/') : name;
}

function isEmptySourceStore(sourceStore) {
    if (!sourceStore) {
        return true;
    }

    var cache = sourceStore.sourceCache;

    return cache && !Object.keys(cache).length;
}

function populateMetrics(metrics)
{
    metricsTypes.forEach(function(metricsType) {
        var metric = metrics[metricsType];

        metric.class = metric.pct === 100 ? 'covered' : 'uncovered';
        metric.uncovered = metric.total - metric.covered;
        metric.stats = metric.covered + ' of ' + metric.total + ' covered (' + Math.round(metric.pct) + '%)';

        if (metric.skipped)
            metric.stats += ', ' + metric.skipped + ' ignored';
    });
}

/**
 * a `Report` implementation that produces interactive HTML coverage reports.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('flow');
 *
 * @class FlowReport
 * @extends Report
 * @module report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to generate reports. Defaults to `./flow-report`
 */
function FlowReport(opts) {
    Report.call(this);
    this.opts = opts || {};
    this.opts.dir = this.opts.dir || path.resolve(process.cwd(), 'flow-report');
    this.opts.sourceStore = isEmptySourceStore(this.opts.sourceStore) ?
        Store.create('fslookup') : this.opts.sourceStore;
    this.opts.linkMapper = this.opts.linkMapper || this.standardLinkMapper();
    this.opts.writer = this.opts.writer || null;
    this.opts.templateData = { datetime: (new Date()).toLocaleString() };
}

FlowReport.TYPE = 'flow';
util.inherits(FlowReport, Report);

Report.mix(FlowReport, {

    synopsis: function () {
        return 'Interactive HTML coverage report for every file and directory';
    },

    getPathHtml: function (node, linkMapper) {
        var parent = node.parent,
            nodePath = [],
            linkPath = [];

        while (parent) {
            nodePath.push(parent);
            parent = parent.parent;
        }

        for (var i = 0; i < nodePath.length; i++) {
            linkPath.push('<a href="' + linkMapper.ancestor(node, i + 1) + '">' +
                (cleanPath(nodePath[i].relativeName) || 'all files') + '</a>');
        }

        linkPath.reverse();

        return linkPath.length > 0 ? linkPath.join(' / ') + ' ' +
            cleanPath(node.displayShortName()) : '/';
    },

    popuplateTemplateData: function (node, templateData) {
        var opts = this.opts,
            linkMapper = opts.linkMapper;

        templateData.timestamp = timestamp;
        templateData.path = node.name || '/';
        templateData.entity = node.name || 'All files';
        templateData.metrics = node.metrics;
        populateMetrics(templateData.metrics);
        templateData.pathHtml = this.getPathHtml(node, linkMapper);
        templateData.base = {
            css: linkMapper.asset(node, 'base.css')
        };
        templateData.jquery = { js: linkMapper.asset(node, 'jquery-2.2.3.min.js') };
        templateData.documentsize = {
            js: linkMapper.asset(node, 'jquery.documentsize.min.js')
        };
        templateData.scrollable = {
            js: linkMapper.asset(node, 'jquery.scrollable.min.js')
        };
        templateData.sorter = {
            js: linkMapper.asset(node, 'sorter.js'),
            image: linkMapper.asset(node, 'sort-arrow-sprite.png')
        };
        templateData.prettify = {
            js: linkMapper.asset(node, 'prettify.js'),
            css: linkMapper.asset(node, 'prettify-desert.css')
        };
        templateData.flow = {
            js: linkMapper.asset(node, 'flow.js')
        };
    },

    writeDetailPage: function (writer, node, fileCoverage) {
        var opts = this.opts,
            sourceStore = opts.sourceStore,
            templateData = opts.templateData,
            sourceText = fileCoverage.code && Array.isArray(fileCoverage.code) ?
                fileCoverage.code.join('\n') + '\n' : sourceStore.get(fileCoverage.path),
            code = sourceText.split(/(?:\r?\n)|\r/),
            count = 0,
            structuredText = code.map(function (str) {
                count++;

                return {
                    line: count,
                    covered: null,
                    text: new InsertionText(str, true)
                };
            });

        structuredText.unshift({ line: 0, covered: null, text: new InsertionText("") });

        // Note: order is important, since statements typically result in spanning the whole line
        // and doing branches late causes mismatched tags
        annotateLines(fileCoverage, structuredText);
        annotateBranches(fileCoverage, node.metrics.branches, structuredText);
        annotate('function', fileCoverage, structuredText);
        annotate('statement', fileCoverage, structuredText);

        this.popuplateTemplateData(node, templateData);
        writer.write(headerTemplate(templateData));

        structuredText.shift();

        var context = {
            structuredText: structuredText,
            maxLines: structuredText.length,
            fileCoverage: fileCoverage
        };

        writeNav(writer, structuredText);
        writer.write('<pre class="content"><table class="coverage">\n');
        writer.write(detailTemplate(context));
        writer.write('</table></pre>\n');
        writer.write(footerTemplate(templateData));
    },

    writeIndexPage: function (writer, node) {
        var linkMapper = this.opts.linkMapper,
            templateData = this.opts.templateData,
            children = Array.prototype.slice.apply(node.children);

        children.sort(function (a, b) {
            return a.name < b.name ? -1 : 1;
        });

        this.popuplateTemplateData(node, templateData);
        writer.write(headerTemplate(templateData));
        writer.write(summaryTableHeader);

        children.forEach(function (child) {
            populateMetrics(child.metrics);

            var data = {
                    metrics: child.metrics,
                    file: cleanPath(child.displayShortName()),
                    fileHref: linkMapper.fromParent(child)
                };

            writer.write(summaryLineTemplate(data));
        });

        writer.write(summaryTableFooter);
        writer.write(footerTemplate(templateData));
    },

    writeFiles: function (writer, node, dir, collector) {
        var that = this,
            indexFile = path.resolve(dir, 'index.html'),
            childFile;

        if (this.opts.verbose) {
            console.error('Writing ' + indexFile);
        }

        writer.writeFile(indexFile, function (contentWriter) {
            that.writeIndexPage(contentWriter, node);
        });

        node.children.forEach(function (child) {
            if (child.kind === 'dir') {
                that.writeFiles(writer, child, path.resolve(dir, child.relativeName), collector);
            } else {
                childFile = path.resolve(dir, child.relativeName + '.html');

                if (that.opts.verbose) {
                    console.error('Writing ' + childFile);
                }

                writer.writeFile(childFile, function (contentWriter) {
                    that.writeDetailPage(contentWriter, child, collector.fileCoverageFor(child.fullPath()));
                });
            }
        });
    },

    standardLinkMapper: function () {
        return {
            fromParent: function (node) {
                var relativeName = cleanPath(node.relativeName);

                return node.kind === 'dir' ? relativeName + 'index.html' : relativeName + '.html';
            },

            ancestorHref: function (node, num) {
                var href = '',
                    notDot = function(part) {
                        return part !== '.';
                    };

                for (var i = 0; i < num; i++) {
                    var separated = cleanPath(node.relativeName).split('/').filter(notDot),
                        levels = separated.length - 1;

                    for (var j = 0; j < levels; j++) {
                        href += '../';
                    }

                    node = node.parent;
                }

                return href;
            },

            ancestor: function (node, num) {
                return this.ancestorHref(node, num) + 'index.html';
            },

            asset: function (node, name) {
                var parent = node.parent;

                for (var i = 0; parent; i++) {
                    parent = parent.parent;
                }

                return this.ancestorHref(node, i) + name;
            }
        };
    },

    writeReport: function (collector, sync) {
        var opts = this.opts,
            dir = opts.dir,
            summarizer = new TreeSummarizer(),
            writer = opts.writer || new FileWriter(sync),
            that = this,

            copyAsset = function (srcDir, f) {
                if (!path.isAbsolute(srcDir)) {
                    srcDir = path.resolve(__dirname, '..', 'assets', srcDir);
                }

                var resolvedSource = path.resolve(srcDir, f),
                    resolvedDestination = path.resolve(dir, f),
                    stat = fs.statSync(resolvedSource);

                if (stat.isFile()) {
                    if (opts.verbose) {
                        console.log('Write asset: ' + resolvedDestination);
                    }

                    writer.copyFile(resolvedSource, resolvedDestination);
                }
            },

            copyAssets = function (subdir) {
                var srcDir = path.resolve(__dirname, '..', 'assets', subdir);

                fs.readdirSync(srcDir).forEach(function (f) {
                    copyAsset(srcDir, f);
                });
            };

        collector.files().forEach(function (key) {
            summarizer.addFileCoverageSummary(key, utils.summarizeFileCoverage(collector.fileCoverageFor(key)));
        });

        var tree = summarizer.getTreeSummary();

        [ 'flow', 'vendor'].forEach(function (subdir) {
            copyAssets(subdir);
        });

        copyAsset('.', 'sort-arrow-sprite.png');
        copyAsset('.', 'sorter.js');

        writer.on('done', function () {
            that.emit('done');
        });

        // console.log(JSON.stringify(tree.root, null, 2));
        this.writeFiles(writer, tree.root, dir, collector);
        writer.done();
    }
});

module.exports = FlowReport;
