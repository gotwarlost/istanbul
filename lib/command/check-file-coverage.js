var nopt = require('nopt');
var path = require('path');
var fs = require('fs');
var Collector = require('../collector');
var formatOption = require('../util/help-formatter').formatOption;
var util = require('util');
var utils = require('../object-utils');
var filesFor = require('../util/file-matcher').filesFor;
var Command = require('./index');

var TreeSummarizer = require('../util/tree-summarizer');

function CheckFileCoverageCommand() {
    Command.call(this);
}

CheckFileCoverageCommand.TYPE = 'check-file-coverage';
util.inherits(CheckFileCoverageCommand, Command);

function FileTreeCoverage(fileTreeRoot, fileCoverageTresholds) {

    function FileCoverage(fileActual, fileTarget) {

        function Coverage(actual, target) {
            this.error = false;
            this.metric = '';

            if (target < 0) {
                if (actual.total + target > actual.covered) {
                    this.error = true;
                }
                this.metric = '' + actual.covered + '/' + actual.total;
            } else {
                if (target > actual.pct) {
                    this.error = true;
                }
                this.metric = actual.pct;
            }
        }

        this.statements = new Coverage(fileActual.statements, fileTarget.statements);
        this.functions = new Coverage(fileActual.functions, fileTarget.functions);
        this.branches = new Coverage(fileActual.branches, fileTarget.branches);
        this.lines = new Coverage(fileActual.lines, fileTarget.lines);
        this.error = function() {
            return this.statements.error || this.functions.error || this.branches.error || this.lines.error;
        };
    }

    function CoverageNode(node, coverage) {
        this.scope = node.displayShortName() || 'All files';
        this.coverage = coverage;
        this.children = [];
        this.pruneCovered = function() {
            var rValue = 0;

            if (this.children.length === 0) {
                if (this.coverage.error()) {
                    rValue = 1;
                }
            } else {
                for (var i = this.children.length - 1; i > -1; i -= 1) {
                    var coverageErrors = this.children[i].pruneCovered();
                    if (coverageErrors === 0) {
                        this.children.splice(i, 1);
                    }
                    rValue += coverageErrors;
                }
            }
            return rValue;
        };
    }

    function buildCoverageTree(node, parentCoverageNode, thresholds) {
        var fileCoverage = new FileCoverage(node.metrics, thresholds);
        var coverageNode = new CoverageNode(node, fileCoverage);

        node.children.forEach(function(child) {
            buildCoverageTree(child, coverageNode, thresholds);
        });

        if (parentCoverageNode !== null) {
            parentCoverageNode.children.push(coverageNode);
        } else {
            return coverageNode;
        }
    }

    this.errorTree = buildCoverageTree(fileTreeRoot, null, fileCoverageTresholds);
    this.errorCount = this.errorTree.pruneCovered();
}

function printErrorTree(errorTree, thresholds) {
    var PCT_COLS = 10;
    var TAB_SIZE = 3;
    var DELIM = ' |';
    var COL_DELIM = '-+';
    var SCOPE_WIDTH;
    var LINE;
    var STRINGS = [];

    var findNameWidth = function(node, level, last) {
        var idealWidth = TAB_SIZE * level + node.scope.length;
        if (idealWidth > last) {
            last = idealWidth;
        }
        node.children.forEach(function(child) {
            last = findNameWidth(child, level + 1, last);
        });
        return last;
    };

    SCOPE_WIDTH = findNameWidth(errorTree, 0, 0);

    function padding(num, pad) {
        var str = '';
        for (var i = 0; i < num; i += 1) {
            str += pad;
        }
        return str;
    }

    LINE = [
        padding(SCOPE_WIDTH, '-'),
        padding(PCT_COLS, '-'),
        padding(PCT_COLS, '-'),
        padding(PCT_COLS, '-'),
        padding(PCT_COLS, '-')
    ].join(COL_DELIM) + COL_DELIM;

    function fill(text, strlen, remaining, rightAligned) {
        if (remaining > 0) {
            if (remaining >= strlen) {
                if (rightAligned) {
                    text = padding(remaining - strlen, ' ') + text;
                } else {
                    text = text + padding(remaining - strlen, ' ');
                }
            } else {
                text = text.substring(strlen - remaining);
                text = '... ' + text.substring(4);
            }
        }
        return text;
    }

    function formatName(name, tabs) {
        var str = padding(tabs * TAB_SIZE, ' ') + name;
        return fill(str, str.length, SCOPE_WIDTH, false);
    }

    function formatRightHeader(str) {
        return fill(str, str.length, PCT_COLS, true);
    }

    function formatRightBody(coverage) {
        var str = String(coverage.metric);
        var strlen = str.length;
        if (Boolean(process.stdout.isTTY)) {
            if (coverage.error) {
                str = '\033[91m' + str + '\033[0m'; // red
            } else {
                str = '\033[92m' + str + '\033[0m'; // green
            }
        }
        return fill(str, strlen, PCT_COLS, true);
    }

    function tableHeader() {
        var elements = [];
        //  TODO: Remove `threshold mode` logic from here
        var statementPrefix = thresholds.statements < 0 ? '#' : '%';
        var functionPrefix = thresholds.functions < 0 ? '#' : '%';
        var branchPrefix = thresholds.branches < 0 ? '#' : '%';
        var linePrefix = thresholds.lines < 0 ? '#' : '%';

        elements.push(formatName('File', 0));
        elements.push(formatRightHeader(statementPrefix + ' Stmts'));
        elements.push(formatRightHeader(branchPrefix + ' Branches'));
        elements.push(formatRightHeader(functionPrefix + ' Funcs'));
        elements.push(formatRightHeader(linePrefix + ' Lines'));

        STRINGS.push(LINE);
        STRINGS.push(elements.join(DELIM) + DELIM);
        STRINGS.push(LINE);
    }

    tableHeader();

    function tableRow(coverageNode, level) {
        var name = coverageNode.scope;
        var elements = [];

        elements.push(formatName(name, level));
        elements.push(formatRightBody(coverageNode.coverage.statements));
        elements.push(formatRightBody(coverageNode.coverage.branches));
        elements.push(formatRightBody(coverageNode.coverage.functions));
        elements.push(formatRightBody(coverageNode.coverage.lines));
        STRINGS.push(elements.join(DELIM) + DELIM);
    }

    function tableBody(coverageNode, level) {
        coverageNode.children.forEach(function(child) {
            tableRow(child, level);
            tableBody(child, level + 1);
        });
        if (level === 2) {
            STRINGS.push(LINE);
        }
    }
    tableBody(errorTree, 1);

    function tableFooter(rootNode) {
        tableRow(rootNode, 0);
        STRINGS.push(LINE);
    }
    tableFooter(errorTree);

    console.log('\n' + STRINGS.join('\n') + '\n');
}

Command.mix(CheckFileCoverageCommand, {
    synopsis: function () {
        return "checks each file in coverage JSON files against coverage thresholds. Exits 1 if file thresholds are not met, 0 otherwise";
    },

    usage: function () {
        util.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' <options> [<include-pattern>]\n\nOptions are:\n\n' +
            [
                formatOption('--statements <threshold>', 'statement coverage threshold'),
                formatOption('--functions <threshold>', 'function coverage threshold'),
                formatOption('--branches <threshold>', 'branch coverage threshold'),
                formatOption('--lines <threshold>', 'line coverage threshold')
            ].join('\n\n') + '\n');

        util.error('\n\n');

        util.error('Thresholds, when specified as a positive number are taken to be the minimum percentage required.');
        util.error('When a threshold is specified as a negative number it represents the maximum number of uncovered entities allowed.\n');
        util.error('For example, --statements 90 implies minimum statement coverage is 90% per file');
        util.error('             --statements -10 implies that no more than 10 uncovered statements are allowed per file\n');
        util.error('<include-pattern> is a fileset pattern that can be used to select one or more coverage files ' +
            'for merge. This defaults to "**/coverage*.json"');

        util.error('\n');
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
        };
        var opts = nopt(config, { v : '--verbose' }, args, 0);
        var includePattern = '**/coverage*.json';

        if (opts.argv.remain.length > 0) {
            includePattern = opts.argv.remain[0];
        }

        var root = opts.root || process.cwd();
        filesFor({
            root: root,
            includes: [ includePattern ]
        }, function (err, files) {

            if (err) {
                throw err;
            }

            var collector = new Collector();
            files.forEach(function(file) {
                var coverageObject =  JSON.parse(fs.readFileSync(file, 'utf8'));
                collector.add(coverageObject);
            });

            var thresholds = {
                statements: opts.statements || 0,
                branches: opts.branches || 0,
                lines: opts.lines || 0,
                functions: opts.functions || 0
            };

            var summarizer = new TreeSummarizer();
            collector.files().forEach(function(key) {
                var fileSummary = utils.summarizeFileCoverage(collector.fileCoverageFor(key));
                summarizer.addFileCoverageSummary(key, fileSummary);
            });

            var fileTreeCoverage = new FileTreeCoverage(summarizer.getTreeSummary().root, thresholds);
            var errors = fileTreeCoverage.errorCount;

            printErrorTree(fileTreeCoverage.errorTree, thresholds);

            return callback(errors === 0 ? null : 'Minimum coverage not met in ' + errors + ' file(s)\n');
        });
    }
});

module.exports = CheckFileCoverageCommand;
