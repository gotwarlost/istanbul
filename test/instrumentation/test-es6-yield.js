/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

if (require('../es6').isYieldAvailable()) {
    module.exports = {
        'should cover yield statements in generators': function (test) {
            code = [
                'function *yielder() {',
                '   yield 1;',
                '   yield 2;',
                '   yield 3;',
                '}',
                'var x = 0, y = yielder();',
                'for (var i = 0; i < 2; i += 1 ) {',
                '   x += y.next().value;',
                '}',
                'output = x;'
            ];
            verifier = helper.verifier(__filename, code);
            verifier.verify(test, [], 3, {
                lines: { '1': 1, '2': 1, '3': 1, '4': 0, '6': 1, '7': 1, '8': 2, '10': 1 },
                branches: {},
                functions: { 1: 1 },
                statements: { '1': 1, '2': 1, '3': 1, '4': 0, '5': 1, '6': 1, '7': 2, '8': 1 }
            });
            test.done();
        }
    };
} else {
    console.error('SKIP: yield is not available in this environment');
}


