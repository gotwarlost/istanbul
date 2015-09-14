/*jslint nomen: true */
var helper = require('../helper'),
   code,
   verifier;

if (require('../es6').isImportAvailable()) {
    module.exports = {
        'should cover import statements': function (test) {
            code = [
                'import util from "util";',
                'output = util.format(args[0], args[1]);'
            ];
            verifier = helper.verifier(__filename, code, {
                esModules: true,
                noAutoWrap: true
            });
            verifier.verify(test, ['foo:%s', 'bar'], 'foo:bar', {
                lines: {'2': 1},
                branches: {},
                functions: {},
                statements: {'1': 1}
            });
            test.done();
        }
    };
}
