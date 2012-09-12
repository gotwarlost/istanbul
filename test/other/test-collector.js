var Collector = require('../../lib/collector'),
    utils = require('../../lib/object-utils'),
    coverageObj,
    coverageObj2,
    collector;

module.exports = {
    "tearDown": function (cb) { collector.dispose(); cb(); },
    "with a single coverage object": {
        setUp: function (cb) {
            var loc = { start: { line: 1, column: 5 }, end: { line: 1, column: 10 } };
            coverageObj = {
                foo: {
                    statementMap: { 1: loc, 2: loc, 3: loc },
                    s: { 1: 0, 2: 3, 3: 5 },
                    b: { 1: [5, 7], 2: [3, 0], 3: [0, 5] },
                    f: { 1: 4, 2: 0, 3: 1},
                    path: 'foo'
                },
                bar: {
                    statementMap: { 1: loc, 2: loc, 3: loc, 4: loc },
                    s: { 1: 0, 2: 0, 3: 17, 4: 3 },
                    b: { 1: [ 0, 8, 9 ], 2: [4, 1], 3: [0, 5] },
                    f: { 1: 7, 2: 78, 3: 9, 4: 0 },
                    path: 'bar'
                }
            };
            collector = new Collector();
            cb();
        },
        "collector should not molest any stats": function (test) {
            collector.add(JSON.parse(JSON.stringify(coverageObj)));
            utils.addDerivedInfo(coverageObj);
            test.deepEqual(['foo', 'bar'], collector.files());
            test.deepEqual(coverageObj, collector.getFinalCoverage());
            test.deepEqual(coverageObj.foo, collector.fileCoverageFor('foo'));
            test.deepEqual(coverageObj.bar, collector.fileCoverageFor('bar'));
            test.done();
        }
    },
    "with multiple coverage objects": {
        setUp: function (cb) {
            var loc = { start: { line: 1, column: 5 }, end: { line: 1, column: 10 } };
            coverageObj = {
                foo: {
                    s: { 1: 0, 2: 3, 3: 5 },
                    statementMap: { 1: loc, 2: loc, 3: loc },
                    b: { 1: [5, 7], 2: [3, 0], 3: [0, 5] },
                    f: { 1: 4, 2: 0, 3: 1},
                    path: 'foo'
                },
                bar: {
                    s: { 1: 0, 2: 0, 3: 17, 4: 3 },
                    statementMap: { 1: loc, 2: loc, 3: loc, 4: loc },
                    b: { 1: [ 0, 8, 9 ], 2: [4, 1], 3: [0, 5] },
                    f: { 1: 7, 2: 78, 3: 9, 4: 0 },
                    path: 'bar'
                }
            };
            coverageObj2 = {
                foo: {
                    s: { 1: 1, 2: 5, 3: 88 },
                    statementMap: { 1: loc, 2: loc, 3: loc },
                    b: { 1: [0, 9], 2: [5, 6], 3: [55, 8] },
                    f: { 1: 0, 2: 0, 3: 9 },
                    path: 'foo'
                }
            };
            collector = new Collector();
            cb();
        },
        "collector should merge foo coverage": function (test) {
            var mergedFoo = utils.mergeFileCoverage(coverageObj.foo, coverageObj2.foo),
                mergedFinal = { foo: mergedFoo, bar: coverageObj.bar };
            collector.add(JSON.parse(JSON.stringify(coverageObj)));
            collector.add(JSON.parse(JSON.stringify(coverageObj2)));
            utils.addDerivedInfo(mergedFinal);
            test.deepEqual(['foo', 'bar'], collector.files());
            test.deepEqual(mergedFinal, collector.getFinalCoverage());
            test.deepEqual(mergedFinal.foo, collector.fileCoverageFor('foo'));
            test.deepEqual(mergedFinal.bar, collector.fileCoverageFor('bar'));
            test.done();
        }
    }
};