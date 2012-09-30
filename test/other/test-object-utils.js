/*jslint nomen: true */
var utils = require('../../lib/object-utils'),
    it,
    it2,
    it3;

module.exports = {
    "with some coverage info": {
        setUp: function (cb) {
            it = {
                foo: {
                    s: {
                        1: 1,
                        2: 2,
                        3: 3,
                        4: 4
                    },
                    statementMap: {
                        1: { start: { line: 1, column: 1}, end: { line: 1, column: 10 }},
                        2: { start: { line: 2, column: 1}, end: { line: 1, column: 9 }},
                        3: { start: { line: 2, column: 10 }, end: { line: 2, column: 20 }},
                        4: { start: { line: 7, column: 0 }, end: { line: 40, column: 10 }}
                    }
                }
            };
            cb();
        },
        "should add/ remove derived coverage correctly": function (test) {
            utils.addDerivedInfo(it);
            var l = it.foo.l;
            test.ok(l);
            test.equals(3, Object.keys(l).length);
            test.equals(1, l[1]);
            test.equals(3, l[2]);
            test.equals(4, l[7]);
            l[7] = 0;
            utils.addDerivedInfo(it);
            test.equals(0, it.foo.l[7]); //does not change
            utils.removeDerivedInfo(it);
            test.ok(!it.foo.l);
            test.done();
        }
    },
    "with full coverage info": {
        setUp: function (cb) {
            it = {
                foo: {
                    s: {
                        1: 1,
                        2: 2,
                        3: 3,
                        4: 4,
                        5: 0
                    },
                    statementMap: {
                        1: { start: { line: 1, column: 1}, end: { line: 1, column: 10 }},
                        2: { start: { line: 2, column: 1}, end: { line: 1, column: 9 }},
                        3: { start: { line: 2, column: 10 }, end: { line: 2, column: 20 }},
                        4: { start: { line: 7, column: 0 }, end: { line: 40, column: 10 }},
                        5: { start: { line: 41, column: 0 }, end: { line: 42, column: 10 }}
                    },
                    f: {
                        1: 10,
                        2: 0
                    },
                    fnMap: {
                        1: { name: 'foo', line: 1 },
                        2: { name: 'anonymous_1', line: 7 }
                    },
                    b: {
                        1: [ 10, 0, 2],
                        2: [ 0, 0]
                    },
                    branchMap: {
                        1: { line: 2, type: 'switch', locations: [ ] },
                        2: { line: 3, type: 'if', locations: [ ] }
                    }
                }
            };
            it2 = it;
            it3 = {
                foo: {
                    s: {
                        1: 2,
                        2: 1,
                        3: 78,
                        4: 99,
                        5: 0
                    },
                    statementMap: {
                        1: { start: { line: 1, column: 1}, end: { line: 1, column: 10 }},
                        2: { start: { line: 2, column: 1}, end: { line: 1, column: 9 }},
                        3: { start: { line: 2, column: 10 }, end: { line: 2, column: 20 }},
                        4: { start: { line: 7, column: 0 }, end: { line: 40, column: 10 }},
                        5: { start: { line: 41, column: 0 }, end: { line: 42, column: 10 }}
                    },
                    f: {
                        1: 9,
                        2: 1
                    },
                    fnMap: {
                        1: { name: 'foo', line: 1 },
                        2: { name: 'anonymous_1', line: 7 }
                    },
                    b: {
                        1: [ 0, 1, 1],
                        2: [ 3, 0]
                    },
                    branchMap: {
                        1: { line: 2, type: 'switch', locations: [ ] },
                        2: { line: 3, type: 'if', locations: [ ] }
                    }
                }
            };
            cb();
        },
        "should calculate correct summary": function (test) {
            var ret = utils.summarizeFileCoverage(it.foo);
            test.deepEqual({ total: 4, covered: 3, pct: 75 }, ret.lines);
            test.deepEqual({ total: 5, covered: 4, pct: 80 }, ret.statements);
            test.deepEqual({ total: 2, covered: 1, pct: 50 }, ret.functions);
            test.deepEqual({ total: 5, covered: 2, pct: 40 }, ret.branches);
            test.done();
        },
        "should return a pct of 100 when nothing is available": function (test) {
            it.foo.b = {};
            var ret = utils.summarizeFileCoverage(it.foo);
            test.deepEqual({ total: 4, covered: 3, pct: 75 }, ret.lines);
            test.deepEqual({ total: 5, covered: 4, pct: 80 }, ret.statements);
            test.deepEqual({ total: 2, covered: 1, pct: 50 }, ret.functions);
            test.deepEqual({ total: 0, covered: 0, pct: 100 }, ret.branches);
            test.done();
        },
        "should merge summary correctly": function (test) {
            var s1 = utils.summarizeFileCoverage(it.foo),
                s2 = utils.summarizeFileCoverage(it2.foo),
                ret = utils.mergeSummaryObjects(s1, s2);
            test.deepEqual({ total: 8, covered: 6, pct: 75 }, ret.lines);
            test.deepEqual({ total: 10, covered: 8, pct: 80 }, ret.statements);
            test.deepEqual({ total: 4, covered: 2, pct: 50 }, ret.functions);
            test.deepEqual({ total: 10, covered: 4, pct: 40 }, ret.branches);
            test.done();
        },
        "should merge summary correctly in one call": function (test) {
            var coverage = { foo: it.foo, 'bar': it2.foo },
                ret = utils.summarizeCoverage(coverage);
            test.deepEqual({ total: 8, covered: 6, pct: 75 }, ret.lines);
            test.deepEqual({ total: 10, covered: 8, pct: 80 }, ret.statements);
            test.deepEqual({ total: 4, covered: 2, pct: 50 }, ret.functions);
            test.deepEqual({ total: 10, covered: 4, pct: 40 }, ret.branches);
            test.done();
        },
        "can merge with a blank object in first position": function (test) {
            var s1 = null,
                s2 = utils.summarizeFileCoverage(it2.foo),
                ret = utils.mergeSummaryObjects(s1, s2);
            test.deepEqual({ total: 4, covered: 3, pct: 75 }, ret.lines);
            test.deepEqual({ total: 5, covered: 4, pct: 80 }, ret.statements);
            test.deepEqual({ total: 2, covered: 1, pct: 50 }, ret.functions);
            test.deepEqual({ total: 5, covered: 2, pct: 40 }, ret.branches);
            test.done();
        },
        "can merge with a blank object in second position": function (test) {
            var s1 = utils.summarizeFileCoverage(it2.foo),
                s2 = null,
                ret = utils.mergeSummaryObjects(s1, s2);
            test.deepEqual({ total: 4, covered: 3, pct: 75 }, ret.lines);
            test.deepEqual({ total: 5, covered: 4, pct: 80 }, ret.statements);
            test.deepEqual({ total: 2, covered: 1, pct: 50 }, ret.functions);
            test.deepEqual({ total: 5, covered: 2, pct: 40 }, ret.branches);
            test.done();
        },
        "can turn it into a YUI coverage object": function (test) {
            var ret = utils.toYUICoverage(it);
            test.deepEqual({ '1': 1, '2': 3, '7': 4, '41': 0 }, ret.foo.lines);
            test.deepEqual({ 'foo:1': 10, 'anonymous_1:7': 0 }, ret.foo.functions);
            test.equal(3, ret.foo.calledLines);
            test.equal(4, ret.foo.coveredLines);
            test.equal(1, ret.foo.calledFunctions);
            test.equal(2, ret.foo.coveredFunctions);
            test.done();
        },
        "merge two like coverage objects for the same file correctly": function (test) {
            var base = JSON.parse(JSON.stringify(it.foo)),
                ret = utils.mergeFileCoverage(base, it3.foo),
                foo = it.foo;
            foo.s[1] += 2;
            foo.s[2] += 1;
            foo.s[3] += 78;
            foo.s[4] += 99;
            foo.f[1] += 9;
            foo.f[2] += 1;
            foo.b[1][1] += 1;
            foo.b[1][2] += 1;
            foo.b[2][0] += 3;

            test.deepEqual(ret, foo);
            test.done();
        }
    }
};