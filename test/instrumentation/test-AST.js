/*jslint nomen: true */
var esprima = require('esprima'),
    Instrumenter = require('../../lib/instrumenter');

/*jshint maxlen: 500 */
module.exports = {
    "instrument an AST": function (test) {
        test.doesNotThrow(function () {
            var code = 'function meaningOfLife() { return 42; }',
                ast = esprima.parse(code, { loc: true }),
                instrumenter = new Instrumenter(),
                changed = instrumenter.instrumentSync(ast, 'filename.js');
        });

        test.done();
    }
};
