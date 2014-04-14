/*jslint nomen: true */
var Instrumenter = require('../../lib/instrumenter'),
    esprima = require('esprima'),
    instrumenter;

module.exports = {
    "missing type attributes": {
        setUp: function (cb) {
            instrumenter = new Instrumenter();
            cb();
        },
        "barfs when a type attr is missing for a general node": function (test) {
            var ast = esprima.parse('var foo = 1;', { loc: true });
            delete ast.body[0].type;
            try {
                instrumenter.instrumentASTSync(ast);
                test.fail('instrumentation succeeded when it should not have');
            } catch (ex) {
                //ok
            }
            test.done();
        },
        "but succeeds when a property node in an AST does not have the type attr": function (test) {
            var ast = esprima.parse('var foo = { a: 1 };', { loc: true });
            delete ast.body[0].declarations[0].init.properties[0].type;
            try {
                instrumenter.instrumentASTSync(ast);
            } catch (ex) {
                test.fail('instrumentation should have succeeded but did not');
            }
            test.done();
        }
    },
    "sourcemap generation": {
        setUp: function (cb) {
            instrumenter = new Instrumenter();
            cb();
        },
        "lastSourceMap returns sourcemap (if available) for last instrumented file": function (test) {
            var instrumenterOpts = instrumenter.opts.codegenerationoptions;
            instrumenter.opts.codegenerationoptions = {
                sourceMap: 'bar',
                sourceMapWithCode: true
            };
            try {
                instrumenter.instrumentSync('var foo = { a: 1 };');
                if (typeof instrumenter.lastSourceMap() !== 'object') {
                    test.fail('sourcemap should be available');
                }

                instrumenter.opts.codegenerationoptions = instrumenterOpts;
                instrumenter.instrumentSync('var foo = { a: 1 };');
                if (instrumenter.lastSourceMap() !== null) {
                    test.fail('sourcemap should not be available');
                }
            } catch (ex) {
                test.fail('instrumentation should have succeeded but did not');
            }
            test.done();
        }
    }
};

