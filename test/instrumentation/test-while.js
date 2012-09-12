/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

module.exports = {
    "with a simple while": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i=0;',
                'while (i < x) i++;',
                'output = i;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover loop exactly once": function (test) {
            verifier.verify(test, [ 1 ], 1, { lines: { 1: 1, 2: 1, 3: 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 1 } });
            test.done();
        },
        "should cover loop multiple times": function (test) {
            verifier.verify(test, [ 10 ], 10, { lines: { 1: 1, 2: 10, 3: 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 10, '4': 1 } });
            test.done();
        }
    },
    "with a simple while - statement on a different line": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i=0;',
                'while (i < x)',
                '   i++;',
                'output = i;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover loop one time": function (test) {
            verifier.verify(test, [ 10 ], 10, { lines: { 1: 1, 2: 1, 3: 10, 4: 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 10, '4': 1 } });
            test.done();
        },

        "should not cover loop at all": function (test) {
            verifier.verify(test, [ -1 ], 0, { lines: { 1: 1, 2: 1, 3: 0, 4: 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 1 } });
            test.done();
        }
    },
    "with a simple while in block": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i=0;',
                'while (i < x) { i++; }',
                'output = i;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover multi-loop exactly once": function (test) {
            verifier.verify(test, [ 10 ], 10, { lines: { 1: 1, 2: 10, 3: 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 10, '4': 1 } });
            test.done();
        }
    },
    "with a labeled while": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i=0, j=0, output = 0;',
                'outer:',
                '   while (i++ < x) {',
                '       j =0;',
                '       while (j++ < i) {',
                '           output++;',
                '           if (j === 2) continue outer;',
                '       }',
                '   }'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should provide line/branch coverage when all branches exercised": function (test) {
            verifier.verify(test, [ 10 ], 19, {
                lines: { '1': 1, '2': 1, '3': 1, '4': 10, '5': 10, '6': 19, '7': 19 },
                branches: { '1': [ 9, 10 ] },
                functions: {},
                statements: { '1': 1, '2': 1, '3': 1, '4': 10, '5': 10, '6': 19, '7': 19, '8': 9 }
            });
            test.done();
        },

        "should provide line/branch coverage when nothing exercised": function (test) {
            verifier.verify(test, [ -1 ], 0, {
                lines: { '1': 1, '2': 1, '3': 1, '4': 0, '5': 0, '6': 0, '7': 0 },
                branches: { '1': [ 0, 0 ] },
                functions: {},
                statements: { '1': 1, '2': 1, '3': 1, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0 }
            });
            test.done();
        }
    }
};

