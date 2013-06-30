/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

/*jshint maxlen: 500 */
module.exports = {
    "with a simple function": {
        setUp: function (cb) {
            code = [
                'var x = args[0];',
                'function foo() {',
                '   return 42;',
                '}',
                'output = x < 5 ? foo() : 15;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover line and function": function (test) {
            verifier.verify(test, [ 2 ], 42, { lines: { 1: 1, 2: 1, 3: 1, 5: 1 }, branches: { 1: [1, 0 ] }, functions: { 1: 1 }, statements: { '1': 1, '2': 1, '3': 1, '4': 1 } });
            test.done();
        },

        "should not cover function": function (test) {
            verifier.verify(test, [ 10 ], 15, { lines: { 1: 1, 2: 1, 3: 0, 5: 1 }, branches: { 1: [ 0, 1 ]}, functions: { 1: 0 }, statements: { '1': 1, '2': 1, '3': 0, '4': 1 } });
            test.done();
        }
    },

    "with an anonymous function": {
        setUp: function (cb) {
            code = [
                'var x = args[0];',
                'output = x < 5 ? (function() { return 42; }()) : 15;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover line and function": function (test) {
            verifier.verify(test, [ 2 ], 42, { lines: { 1: 1, 2: 1 }, branches: { 1: [1, 0 ] }, functions: { 1: 1 }, statements: { '1': 1, '2': 1, '3': 1 } });
            test.done();
        },

        "should not cover function": function (test) {
            verifier.verify(test, [ 10 ], 15, { lines: { 1: 1, 2: 1 }, branches: { 1: [ 0, 1 ]}, functions: { 1: 0 }, statements: { '1': 1, '2': 1, '3': 0 } });
            test.done();
        }
    },

    "with an anonymous function on newline": {
        setUp: function (cb) {
            code = [
                'var x = args[0];',
                'output = x < 5 ? ',
                '   (function() { ',
                '   return 42; ',
                '}())',
                ' : 15;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover line and function": function (test) {
            verifier.verify(test, [ 2 ], 42, { lines: { 1: 1, 2: 1, 4: 1 }, branches: { 1: [1, 0 ] }, functions: { 1: 1 }, statements: { 1: 1, 2: 1, 3: 1} });
            test.done();
        },

        "should not cover function": function (test) {
            verifier.verify(test, [ 10 ], 15, { lines: { 1: 1, 2: 1, 4: 0 }, branches: { 1: [ 0, 1 ]}, functions: { 1: 0 }, statements: { 1: 1, 2: 1, 3: 0 } });
            test.done();
        }
    },

    "with a function declared in an 'unreachable' place": {
        setUp: function (cb) {
            code = [
                'function foo(x) {',
                '   return bar(x);',
                '   function bar(y) { return y * 2 }',
                '}',
                'output = args[0] < 2 ? 2: foo(args[0]);'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should not cover functions but should cover declarations": function (test) {
            verifier.verify(test, [ 1 ], 2, { lines: { 1: 1, 2: 0, 3: 1, 5: 1 }, branches: { 1: [1, 0 ] }, functions: { 1: 0, 2: 0 }, statements: { 1: 1, 2: 0, 3: 1, 4: 0, 5: 1} });
            test.done();
        },

        "should cover functions and declarations": function (test) {
            verifier.verify(test, [ 10 ], 20, { lines: { 1: 1, 2: 1, 3: 1, 5: 1 }, branches: { 1: [ 0, 1 ]}, functions: { 1: 1, 2: 1 }, statements: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } });
            test.done();
        }
    }
};

