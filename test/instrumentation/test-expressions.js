/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

/*jshint maxlen: 500 */
module.exports = {
    "with a simple expression": {
        setUp: function (cb) {
            code = [
                'var x = args[0] > 0 && args[0] < 5;',
                'output = x;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover line and one branch": function (test) {
            verifier.verify(test, [ -1 ], false, { lines: { 1: 1, 2: 1 }, branches: { 1: [ 1, 0 ]}, functions: {}, statements: { '1': 1, '2': 1 } });
            test.done();
        },
        "should cover line, both branches but return false": function (test) {
            verifier.verify(test, [ 10 ], false, { lines: { 1: 1, 2: 1 }, branches: { 1: [ 1, 1 ]}, functions: {}, statements:  { '1': 1, '2': 1 } });
            test.done();
        },
        "should cover line, both branches and return true": function (test) {
            verifier.verify(test, [ 3 ], true, { lines: { 1: 1, 2: 1 }, branches: { 1: [ 1, 1 ]}, functions: {}, statements:  { '1': 1, '2': 1 } });
            test.done();
        }
    },
    "with a complex expression": {
        setUp: function (cb) {
            code = [
                'var x = args[0] > 0 && (args[0] < 5 || args[0] > 10);',
                'output = x;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover line and one branch": function (test) {
            verifier.verify(test, [ -1 ], false, { lines: { 1: 1, 2: 1 }, branches: { 1: [ 1, 0, 0 ]}, functions: {}, statements: { '1': 1, '2': 1 } });
            test.done();
        },
        "should cover line, both branches but return false": function (test) {
            verifier.verify(test, [ 9 ], false, { lines: { 1: 1, 2: 1 }, branches: { 1: [ 1, 1, 1 ]}, functions: {}, statements: { '1': 1, '2': 1 } });
            test.done();
        },
        "should cover line, both branches and return true": function (test) {
            verifier.verify(test, [ 3 ], true, { lines: { 1: 1, 2: 1 }, branches: { 1: [ 1, 1, 0 ]}, functions: {}, statements: { '1': 1, '2': 1 } });
            test.done();
        }
    },
    "with an array expression with empty positions": {
        setUp: function (cb) {
            code = [
                'var x = [, , args[0], ];',
                'output = x.indexOf(args[0]) === x.length - 1;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should not barf in any way": function (test) {
            verifier.verify(test, [ 5 ], true, { lines: { 1: 1, 2: 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1 } });
            test.done();
        }
    }
};

