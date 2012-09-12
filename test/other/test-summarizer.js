var TreeSummarizer = require('../../lib/util/tree-summarizer'),
    utils = require('../../lib/object-utils'),
    summarizer,
    tree,
    s1,
    s2,
    s3;

module.exports = {
    setUp: function (cb) {
        summarizer = new TreeSummarizer();
        s1 = {
            statements: { covered: 5, total: 10, pct: 50 },
            lines: { covered: 5, total: 10, pct: 50 },
            functions: { covered: 15, total: 20, pct: 75 },
            branches: { covered: 100, total: 200, pct: 50 }
        };
        s2 = {
            statements: { covered: 10, total: 20, pct: 50 },
            lines: { covered: 10, total: 20, pct: 50 },
            functions: { covered: 75, total: 100, pct: 75 },
            branches: { covered: 1, total: 2, pct: 50 }
        };
        s3 = {
            statements: { covered: 9, total: 10, pct: 90 },
            lines: { covered: 9, total: 10, pct: 90 },
            functions: { covered: 15, total: 15, pct: 100 },
            branches: { covered: 101, total: 101, pct: 100 }
        };
        cb();
    },
    "with a few files in a few dirs": {
        setUp: function (cb) {
            summarizer.addFileCoverageSummary('/tmp/lib/foo.js', s1);
            summarizer.addFileCoverageSummary('/tmp/lib/bar.js', s2);
            summarizer.addFileCoverageSummary('/tmp/lib/util/baz.js', s3);
            tree = summarizer.getTreeSummary();
            cb();
        },
        "should be JSON serializable": function (test) {
            test.ok(JSON.stringify(tree));
            test.done();
        },
        "should have the correct tree with root hoisted one level above code": function (test) {
            var node = tree.root,
                utilSummary = utils.mergeSummaryObjects(s3),
                libSummary = utils.mergeSummaryObjects(s1, s2),
                fullSummary = utils.mergeSummaryObjects(utilSummary, libSummary);
            test.equal('/tmp/', node.fullPath());
            test.equal('', node.displayShortName());
            test.equal(2, node.children.length);
            test.deepEqual(fullSummary, node.metrics);
            test.ok(node === tree.getNode(''));
            node = tree.root.children[0];
            test.equal('/tmp/lib/', node.fullPath());
            test.equal('lib/', node.displayShortName());
            test.equal(2, node.children.length);
            test.deepEqual(libSummary, node.metrics);
            test.deepEqual(s2, node.children[0].metrics);
            test.deepEqual(s1, node.children[1].metrics);
            test.ok(node === tree.getNode('lib/'));
            node = tree.root.children[1];
            test.equal('/tmp/lib/util/', node.fullPath());
            test.equal('lib/util/', node.displayShortName());
            test.equal(1, node.children.length);
            test.deepEqual(utilSummary, node.metrics);
            test.deepEqual(s3, node.children[0].metrics);
            test.ok(node === tree.getNode('lib/util/'));
            test.ok(tree.getNode('lib/foo.js'));
            test.ok(tree.getNode('lib/bar.js'));
            test.ok(tree.getNode('lib/util/baz.js'));
            test.done();
        }
    },
    "with the same few files organized differently": {
        setUp: function (cb) {
            summarizer.addFileCoverageSummary('/tmp/lib/main/foo.js', s1);
            summarizer.addFileCoverageSummary('/tmp/lib/main/bar.js', s2);
            summarizer.addFileCoverageSummary('/tmp/lib/util/baz.js', s3);
            tree = summarizer.getTreeSummary();
            cb();
        },
        "should have the correct tree with no root hoisting": function (test) {
            var node = tree.root,
                utilSummary = utils.mergeSummaryObjects(s3),
                libSummary = utils.mergeSummaryObjects(s1, s2),
                fullSummary = utils.mergeSummaryObjects(utilSummary, libSummary);
            test.equal('/tmp/lib/', node.fullPath());
            test.equal('', node.displayShortName());
            test.equal(2, node.children.length);
            test.deepEqual(fullSummary, node.metrics);
            test.ok(node === tree.getNode(''));
            node = tree.root.children[0];
            test.equal('/tmp/lib/main/', node.fullPath());
            test.equal('main/', node.displayShortName());
            test.equal(2, node.children.length);
            test.deepEqual(libSummary, node.metrics);
            test.deepEqual(s2, node.children[0].metrics);
            test.deepEqual(s1, node.children[1].metrics);
            test.ok(node === tree.getNode('main/'));
            node = tree.root.children[1];
            test.equal('/tmp/lib/util/', node.fullPath());
            test.equal('util/', node.displayShortName());
            test.equal(1, node.children.length);
            test.deepEqual(utilSummary, node.metrics);
            test.deepEqual(s3, node.children[0].metrics);
            test.ok(node === tree.getNode('util/'));
            test.ok(tree.getNode('main/foo.js'));
            test.ok(tree.getNode('main/bar.js'));
            test.ok(tree.getNode('util/baz.js'));
            test.done();
        }
    },
    "with no room for hoisting": {
        setUp: function (cb) {
            summarizer.addFileCoverageSummary('/foo.js', s1);
            summarizer.addFileCoverageSummary('/bar.js', s2);
            summarizer.addFileCoverageSummary('/util/baz.js', s3);
            tree = summarizer.getTreeSummary();
            //console.log(JSON.stringify(tree, undefined, 2));
            cb();
        },
        "should build a correct tree but with a mangled name for the main dir": function (test) {
            var node = tree.root,
                utilSummary = utils.mergeSummaryObjects(s3),
                libSummary = utils.mergeSummaryObjects(s1, s2),
                fullSummary = utils.mergeSummaryObjects(utilSummary, libSummary);
            test.equal('/', node.fullPath());
            test.equal('', node.displayShortName());
            test.equal(2, node.children.length);
            test.deepEqual(fullSummary, node.metrics);
            test.ok(node === tree.getNode(''));
            node = tree.root.children[0];
            test.equal('/__root__/', node.fullPath());
            test.equal('__root__/', node.displayShortName());
            test.equal(2, node.children.length);
            test.deepEqual(libSummary, node.metrics);
            test.deepEqual(s2, node.children[0].metrics);
            test.deepEqual(s1, node.children[1].metrics);
            test.ok(node === tree.getNode('__root__/'));
            node = tree.root.children[1];
            test.equal('/util/', node.fullPath());
            test.equal('util/', node.displayShortName());
            test.equal(1, node.children.length);
            test.deepEqual(utilSummary, node.metrics);
            test.deepEqual(s3, node.children[0].metrics);
            test.ok(node === tree.getNode('util/'));
            test.ok(tree.getNode('foo.js'));
            test.ok(tree.getNode('bar.js'));
            test.ok(tree.getNode('util/baz.js'));
            test.done();
        }
    },
    "with no summaries provided at all": {
        setUp: function (cb) {
            tree = summarizer.getTreeSummary();
            cb();
        },
        "should build a blank tree with a root": function (test) {
            var node = tree.root,
                blank = utils.blankSummary();

            blank.statements.pct = blank.lines.pct = blank.branches.pct = blank.functions.pct = 100;
            test.ok(node);
            test.equal('/', node.fullPath());
            test.equal('', node.displayShortName());
            test.equal(0, node.children.length);
            test.deepEqual(blank, node.metrics);
            test.done();
        }
    }
};