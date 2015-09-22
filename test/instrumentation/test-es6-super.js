/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

if (require('../es6').isSuperAvailable()) {
    module.exports = {
        'should cover super in constructor': function (test) {
            code = [
                'class A {',
                '   constructor(x) {',
                '      this.x = x;',
                '   }',
                '   getX() {',
                '      return "x";',
                '   }',
                '}',
                'class B extends A {',
                '   constructor(x) {',
                '      super(x);',
                '   }',
                '   getX() {',
                '      return this.x;',
                '   }',
                '}',
                'output = (new B("super")).getX();'
            ];
            verifier = helper.verifier(__filename, code);
            verifier.verify(test, ['super'], 'super', {
                lines: { 3: 1, 6: 0, 11: 1, 14: 1, 17: 1 },
                branches: {},
                functions: { 1: 1, 2: 0, 3: 1, 4: 1 },
                statements: { 1: 1, 2: 0, 3: 1, 4: 1, 5: 1 }
            });
            test.done();
        },
        'should cover super in method': function (test) {
            code = [
                'class A {',
                '   constructor(x) {',
                '      this.x = x;',
                '   }',
                '   getX() {',
                '      return "x";',
                '   }',
                '}',
                'class B extends A {',
                '   constructor(x) {',
                '      super(x);',
                '   }',
                '   getX() {',
                '      return super.getX();',
                '   }',
                '}',
                'output = (new B("super")).getX();'
            ];
            verifier = helper.verifier(__filename, code);
            verifier.verify(test, ['super'], 'x', {
                lines: { 3: 1, 6: 1, 11: 1, 14: 1, 17: 1 },
                branches: {},
                functions: { 1: 1, 2: 1, 3: 1, 4: 1 },
                statements: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }
            });
            test.done();
        }
    };
}



