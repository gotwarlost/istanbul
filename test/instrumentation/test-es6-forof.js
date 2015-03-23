/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

/*jshint maxlen: 500 */
if (require('../es6').isForOfAvailable()) {
    module.exports = {
        "with a simple for-in": {
            setUp: function (cb) {
                code = [
                    'function *x() { yield 1; yield 2; };',
                    'var k;',
                    'output = 0;',
                    'for (k of x()) {',
                    '   output += k;',
                    '}'
                ];
                verifier = helper.verifier(__filename, code);
                cb();
            },

            "should cover loop exactly once": function (test) {
                verifier.verify(test, [], 3, { lines: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 2 }, branches: {}, functions: { '1': 1 }, statements: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 2 } });
                test.done();
            }
        },
        "with a simple for-of declaring the loop initializer": {
            setUp: function (cb) {
                code = [
                    'function *x() { yield 1; yield 2; };',
                    'output = 0;',
                    'for (var k of x()) {',
                    '   output += k;',
                    '}'
                ];
                verifier = helper.verifier(__filename, code);
                cb();
            },

            "should cover loop exactly once": function (test) {
                verifier.verify(test, [], 3, { lines: { '1': 1, '2': 1, '3': 1, '4': 2 }, branches: {}, functions: { '1': 1 }, statements: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 2 } });
                test.done();
            }
        }
    };
}

