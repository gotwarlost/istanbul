/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

module.exports = {
    "with a simple for-in": {
        setUp: function (cb) {
            code = [
                'var x = { a: args[0], b: args[1] }, k;',
                'output = 0;',
                'for (k in x) {',
                '   if (x.hasOwnProperty(k) && x[k]) {',
                '       output += x[k];',
                '   }',
                '}'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover loop exactly once": function (test) {
            verifier.verify(test, [ 10, 0 ], 10, { lines: { 1: 1, 2: 1, 3: 1, 4: 2, 5: 1 }, branches: { 1: [1, 1], 2: [ 2, 2 ] }, functions: {}, statements: { 1: 1, 2: 1, 3: 1, 4: 2, 5: 1 } });
            test.done();
        }
    },

    "with a simple for-in declaring the loop initializer": {
        setUp: function (cb) {
            code = [
                'var x = { a: args[0], b: args[1] };',
                'output = 0;',
                'for (var k in x) {',
                '   if (x.hasOwnProperty(k) && x[k]) {',
                '       output += x[k];',
                '   }',
                '}'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover loop exactly once": function (test) {
            verifier.verify(test, [ 10, 0 ], 10, { lines: { 1: 1, 2: 1, 3: 1, 4: 2, 5: 1 }, branches: { 1: [1, 1], 2: [ 2, 2 ] }, functions: {}, statements: { 1: 1, 2: 1, 3: 1, 4: 2, 5: 1 } });
            test.done();
        }
    }
};

