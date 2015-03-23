/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

/*jshint maxlen: 500 */
module.exports = {
    "with an simple try catch": {
        setUp: function (cb) {
            code = [
                'try {',
                '   if (args[0] === "X") { throw "foo"; }',
                '   output = args[0];',
                '} catch (ex) {',
                '   output="Y";',
                '} finally {',
                '   output += 1;',
                '}'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover happy path correctly": function (test) {
            verifier.verify(test, [1], 2, { lines: { '1': 1, '2': 1, 3: 1, 5: 0, 7: 1 }, branches: { 1: [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, 4: 1, 5: 0, 6: 1} });
            test.done();
        },
        "should cover sad path correctly": function (test) {
            verifier.verify(test, ['X'], 'Y1', { lines: { '1': 1, '2': 1, 3: 0, 5: 1, 7: 1 }, branches: { 1: [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, 4: 0, 5: 1, 6: 1} });
            test.done();
        }
    }
};

