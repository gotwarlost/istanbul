/*jslint nomen: true */
var helper = require('../helper'),
   code,
   verifier;

if (require('../es6').isExportAvailable()) {
    module.exports = {
        'should cover export statements': function (test) {
            code = [
                'export function bar() { return 2 }',
                'output = bar()'
            ];
            verifier = helper.verifier(__filename, code, {
                esModules: true,
                noAutoWrap: true
            });
            verifier.verify(test, [], 2, {
                lines: {'1': 1, '2': 1},
                branches: {},
                functions: {'1': 1},
                statements: {'1': 1, '2': 1, '3': 1}
            });
            test.done();
        },

        'should cover export declarations': function (test) {
            code = [
                'export var a = 2, b = 3;',
                'output = a + b'
            ];
            verifier = helper.verifier(__filename, code, {
                esModules: true,
                noAutoWrap: true
            });
            verifier.verify(test, [], 5, {
                lines: {'1':1, '2': 1},
                branches: {},
                functions: {},
                statements: {'1': 1, '2': 1}
            });
            test.done();
        }
    };
}
