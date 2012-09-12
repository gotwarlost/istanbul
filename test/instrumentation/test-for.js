/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

module.exports = {
    "with a simple for": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i, j = -10;',
                'for (i =0; i < x; i++) j = i;',
                'output = j;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover loop exactly once": function (test) {
            verifier.verify(test, [ 10 ], 9, {
                lines: { 1: 1, 2: 10, 3: 1 },
                branches: { },
                functions: {},
                statements: { '1': 1, '2': 1, '3': 10, '4': 1 }
            });
            test.done();
        }
    },
    "with a simple for - declaring the loop variable in initializer": {
        setUp: function (cb) {
            code = [
                'var x = args[0], j = -10;',
                'for (var i =0; i < x; i++) j = i;',
                'output = j;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover loop exactly once": function (test) {
            verifier.verify(test, [ 10 ], 9, {
                lines: { 1: 1, 2: 10, 3: 1 },
                branches: { },
                functions: {},
                statements: { '1': 1, '2': 1, '3': 10, '4': 1 }
            });
            test.done();
        }
    },
    "with a simple for - not having an initializer": {
        setUp: function (cb) {
            code = [
                'var x = args[0], j = -10, i=0;',
                'for (; i < x; i++) j = i;',
                'output = j;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover loop exactly once": function (test) {
            verifier.verify(test, [ 10 ], 9, {
                lines: { 1: 1, 2: 10, 3: 1 },
                branches: { },
                functions: {},
                statements: { '1': 1, '2': 1, '3': 10, '4': 1 }
            });
            test.done();
        }
    },
    "with a simple for - statement on a different line": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i, j = -10;',
                'for (i =0; i < x; i++)',
                '   j = i;',
                'output = j;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover loop one time": function (test) {
            verifier.verify(test, [ 10 ], 9, {
                lines: { 1: 1, 2: 1, 3: 10, 4: 1 },
                branches: {},
                functions: {},
                statements: { '1': 1, '2': 1, '3': 10, '4': 1 }
            });
            test.done();
        },

        "should not cover loop at all": function (test) {
            verifier.verify(test, [ -1 ], -10, {
                lines: { 1: 1, 2: 1, 3: 0, 4: 1 },
                branches: {},
                functions: {},
                statements: { '1': 1, '2': 1, '3': 0, '4': 1 }
            });
            test.done();
        }
    },
    "with a simple for in block": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i, j = -10;',
                'for (i =0; i < x; i++) { j = i; }',
                'output = j;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover multi-loop exactly once": function (test) {
            verifier.verify(test, [ 10 ], 9, {
                lines: { 1: 1, 2: 10, 3: 1 },
                branches: { },
                functions: {},
                statements: { '1': 1, '2': 1, '3': 10, '4': 1 }
            });
            test.done();
        },

        "should not cover loop at all": function (test) {
            verifier.verify(test, [ -1 ], -10, {
                lines: { 1: 1, 2: 1, 3: 1 },
                branches: {},
                functions: {},
                statements: { '1': 1, '2': 1, '3': 0, '4': 1 }
            });
            test.done();
        }
    },
    "with a labeled for": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i, j = -10;',
                'outer:for (i =0; i < x; i++) { j = i; }',
                'output = j;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover multi-loop exactly once": function (test) {
            verifier.verify(test, [ 10 ], 9, {
                lines: { 1: 1, 2: 10, 3: 1 },
                branches: {},
                functions: {},
                statements: { '1': 1, '2': 1, '3': 1, '4': 10, '5': 1 }
            });
            test.done();
        }
    },
    "with a nested labeled for": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i, j, k = 0;',
                'outer:for (i = 0; i < x; i++)',
                '   for (j=0; j < i ; j++) {',
                '       if (j === 2) continue outer;',
                '       k++;',
                '   }',
                'output = k;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover multi-loop exactly once": function (test) {
            verifier.verify(test, [ 10 ], 17, {
                lines: { '1': 1, '2': 1, '3': 10, '4': 24, '5': 17, '7': 1 },
                branches: { '1': [ 7, 17 ] },
                functions: {},
                statements: { '1': 1, '2': 1, '3': 1, '4': 10, '5': 24, '6': 7, '7': 17, '8': 1 }
            });
            test.done();
        }
    },
    "with a nested labeled for (label on different line)": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i, j, k = 0;',
                'outer:',
                'for (i = 0; i < x; i++)',
                '   for (j=0; j < i ; j++) {',
                '       if (j === 2) continue outer;',
                '       k++;',
                '   }',
                'output = k;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover multi-loop exactly once": function (test) {
            verifier.verify(test, [ 10 ], 17, {
                lines: { '1': 1, '2': 1, '3': 1, '4': 10, '5': 24, '6': 17, '8': 1 },
                branches: { '1': [ 7, 17 ] },
                functions: {},
                statements: { '1': 1, '2': 1, '3': 1, '4': 10, '5': 24, '6': 7, '7': 17, '8': 1 }
            });
            test.done();
        }
    }
};

