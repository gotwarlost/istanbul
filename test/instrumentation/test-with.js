/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

/*jshint maxlen: 500 */
module.exports = {
    "with a with statement - no blocks": {
        setUp: function (cb) {
            code = [
                'with (Math) output = abs(args[0]);'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover everything correctly": function (test) {
            verifier.verify(test, [ -1 ], 1, { lines: { 1: 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1 } });
            test.done();
        }
    },
    "with a with statement - in a block": {
        setUp: function (cb) {
            code = [
                'with (Math) { output = abs(args[0]); }'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover everything correctly": function (test) {
            verifier.verify(test, [ -1 ], 1, { lines: { 1: 1 }, branches: {}, functions: {}, statements: { '1': 1, '2': 1 } });
            test.done();
        }
    }
};

