/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

/*jshint maxlen: 500 */
module.exports = {
    "with a simple do-while": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i=0;',
                'do { i++; } while (i < x);',
                'output = i;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should provide correct line coverage": function (test) {
            verifier.verify(test, [ 10 ], 10, { lines: { 1: 1, 2: 10, 3: 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 10, '4': 1 } });
            test.done();
        },

        "should cover single-entry into while": function (test) {
            verifier.verify(test, [ -1 ], 1, { lines: { 1: 1, 2: 1, 3: 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 1 } });
            test.done();
        }
    },
    "with a block do-while on separate line": {
        setUp: function (cb) {
            code = [
                'var x = args[0], i=0;',
                'do { ',
                '   i++; ',
                '} while (i < x);',
                'output = i;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should provide correct line coverage": function (test) {
            verifier.verify(test, [ 10 ], 10, { lines: { 1: 1, 2: 1, 3: 10, 5: 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 10, '4': 1 } });
            test.done();
        },

        "should cover single-entry into while": function (test) {
            verifier.verify(test, [ -1 ], 1, { lines: { 1: 1, 2: 1, 3: 1, 5: 1 }, branches: {}, functions: {}, statements:  { '1': 1, '2': 1, '3': 1, '4': 1 } });
            test.done();
        }
    },
    "with an ignore inside a do-while": {
        setUp: function (cb) {
            code = [
                'do { ',
                '   /* istanbul ignore next */ ',
                '   console.log("hi");',
                '} while (false);',
                'output = 10'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should mark statement as skipped": function (test) {
            verifier.verify(test, [], 10, { lines: { '1': 1, '3': 1, '5': 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 1 } });
            var cov = verifier.getFileCoverage();
            test.equal(true, cov.statementMap[2].skip);
            test.done();
        }
    }
};

