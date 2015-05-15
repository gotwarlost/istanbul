/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

/*jshint maxlen: 500 */
if (require('../es6').isArrowFnAvailable()) {
    module.exports = {
        "with an expression arrow expression": {
            setUp: function (cb) {
                code = [
                    'var input = args',
                    'output = input.map(x => x * x)'
                ];
                verifier = helper.verifier(__filename, code);
                cb();
            },

            "should cover it correctly": function (test) {
                verifier.verify(test, [1, 2, 3, 4], [1, 4, 9, 16], { lines: { '1': 1, '2': 4 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 4} });
                test.done();
            },

            "should report no calls correctly": function (test) {
                verifier.verify(test, [], [], { lines: { '1': 1, '2': 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 0} });
                test.done();
            }
        },
        "with a block arrow expression": {
            setUp: function (cb) {
                code = [
                    'var input = args',
                    'output = input.map(x => { return x * x; })'
                ];
                verifier = helper.verifier(__filename, code);
                cb();
            },

            "should cover it correctly": function (test) {
                verifier.verify(test, [1, 2, 3, 4], [1, 4, 9, 16], { lines: { '1': 1, '2': 4 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 4} });
                test.done();
            },

            "should report no calls correctly": function (test) {
                verifier.verify(test, [], [], { lines: { '1': 1, '2': 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1, '3': 0} });
                test.done();
            }
        }
    };
}

