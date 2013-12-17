/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

module.exports = {
    "with a function expression that uses strict": {
        setUp: function (cb) {
            code = [
                '(function () {',
                '    "use strict";',
                '    var x = Object.freeze({ foo: 1 });',
                '    try {',
                '        x.foo = 2;',
                '        output = "fail";',
                '    } catch (ex) {',
                '        output = "pass";',
                '    }',
                '}());'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover one statement less": function (test) {
            verifier.verify(test, [], "pass", {
                statements: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 0, 6: 1 },
                lines: { 1: 1, 3: 1, 4: 1, 5: 1, 6: 0, 8: 1 },
                branches: {},
                functions: { 1: 1}
            });
            test.done();
        }
    },
    "with a function declaration that uses strict": {
        setUp: function (cb) {
            code = [
                'function foo() {',
                '    "use strict";',
                '    var x = Object.freeze({ foo: 1 });',
                '    try {',
                '        x.foo = 2;',
                '        output = "fail";',
                '    } catch (ex) {',
                '        output = "pass";',
                '    }',
                '}',
                'foo();'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover one statement less": function (test) {
            verifier.verify(test, [], "pass", {
                statements: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 0, 6: 1, 7: 1 },
                lines: { 1: 1, 3: 1, 4: 1, 5: 1, 6: 0, 8: 1, 11: 1 },
                branches: {},
                functions: { 1: 1}
            });
            test.done();
        }
    },
    "with a function declaration that looks like strict but is not": {
        setUp: function (cb) {
            code = [
                'function foo() {',
                '    1;',
                '    "use strict";',
                '    var x = Object.freeze({ foo: 1 });',
                '    try {',
                '        x.foo = 2;',
                '        output = "fail";',
                '    } catch (ex) {',
                '        output = "pass";',
                '    }',
                '}',
                'foo();'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover all statements as usual": function (test) {
            verifier.verify(test, [], "fail", {
                statements: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 0, 9: 1 },
                lines: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 9: 0, 12: 1 },
                branches: {},
                functions: { 1: 1}
            });
            test.done();
        }
    },
    "with a file-level strict declaration": {
        setUp: function (cb) {
            code = [
                '    "use strict";',
                '    var x = Object.freeze({ foo: 1 });',
                '    try {',
                '        x.foo = 2;',
                '        output = "fail";',
                '    } catch (ex) {',
                '        output = "pass";',
                '    }'
            ];
            console.log(code.join("\n"));
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should correctly interpret the strict statement": function (test) {
            // use strict semantics still do not work since it is not top-level but called from vm.runInThisContext
            verifier.verify(test, [], "fail", {
                //however statements and lines should line up
                statements: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 0 },
                lines: { 2: 1, 3: 1, 4: 1, 5: 1, 7: 0 },
                branches: {},
                functions: {}
            });
            test.done();
        }
    }
};

