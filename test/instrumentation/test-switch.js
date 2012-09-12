/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;
module.exports = {
    "with an empty switch": {
        setUp: function (cb) {
            code = [
                'output = "unknown";',
                'switch (args[0]) {',
                '}'
            ];
            verifier = helper.verifier(__filename, code);
            cb(null);
        },
        "should not barf in any way": function (test) {
            verifier.verify(test, [ "1" ], "unknown", { lines: { 1: 1, 2: 1 }, branches: {}, functions: {}, statements: { 1: 1, 2: 1 } });
            test.done();
        }
    },
    "with a simple switch": {
        "and 2 cases without a default": {
            setUp: function (cb) {
                code = [
                    'output = "unknown";',
                    'switch (args[0]) {',
                    '   case "1": output = "one"; break;',
                    '   case "2": output = "two"; break;',
                    '}'
                ];
                verifier = helper.verifier(__filename, code);
                cb(null);
            },
            "should cover one path": function (test) {
                verifier.verify(test, [ "1" ], "one", { lines: { 1: 1, 2: 1, 3: 1, 4: 0 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 0, 6: 0 } });
                test.done();
            },
            "should cover two path": function (test) {
                verifier.verify(test, [ "2" ], "two", { lines: { 1: 1, 2: 1, 3: 0, 4: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 1, 6: 1 } });
                test.done();
            },
            "should cover unknown path": function (test) {
                verifier.verify(test, [ "3" ], "unknown", { lines: { 1: 1, 2: 1, 3: 0, 4: 0 }, branches: { '1': [ 0, 0 ] }, functions: {}, statements: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0 } });
                test.done();
            }
        },
        "and 2 cases with a default": {
            setUp: function (cb) {
                code = [
                    'output = "unknown";',
                    'switch (args[0]) {',
                    '   case "1": output = "one"; break;',
                    '   case "2": output = "two"; break;',
                    '   default: output = "three";',
                    '}'
                ];
                verifier = helper.verifier(__filename, code);
                cb(null);
            },
            "should cover one path": function (test) {
                verifier.verify(test, [ "1" ], "one", { lines: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0 }, branches: { '1': [ 1, 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 0, '6': 0, '7': 0 } });
                test.done();
            },
            "should cover two path": function (test) {
                verifier.verify(test, [ "2" ], "two", { lines: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 0 }, branches: { '1': [ 0, 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0, '5': 1, '6': 1, '7': 0 } });
                test.done();
            },
            "should cover unknown path": function (test) {
                verifier.verify(test, [ "4" ], "three", { lines: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 1 }, branches: { '1': [ 0, 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0, '5': 0, '6': 0, '7': 1 } });
                test.done();
            }
        },
        "and 2 cases with a default everything squeezed on one line": {
            setUp: function (cb) {
                code = [
                    'output = "unknown";',
                    'switch (args[0]) {' +
                        '   case "1": output = "one"; break;' +
                        '   case "2": output = "two"; break;' +
                        '   default: output = "three";' +
                        '}'
                ];
                verifier = helper.verifier(__filename, code);
                cb(null);
            },
            "should cover one path": function (test) {
                verifier.verify(test, [ "1" ], "one", { lines: { 1: 1, 2: 1 }, branches: { '1': [ 1, 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 0, '6': 0, '7': 0 } });
                test.done();
            },
            "should cover two path": function (test) {
                verifier.verify(test, [ "2" ], "two", { lines: { 1: 1, 2: 1 }, branches: { '1': [ 0, 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0, '5': 1, '6': 1, '7': 0 } });
                test.done();
            },
            "should cover unknown path": function (test) {
                verifier.verify(test, [ "4" ], "three", { lines: { 1: 1, 2: 1  }, branches: { '1': [ 0, 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0, '5': 0, '6': 0, '7': 1 } });
                test.done();
            }
        },
        "and 2 cases with a default and fall-thru": {
            setUp: function (cb) {
                code = [
                    'output = "";',
                    'switch (args[0]) {',
                    '   case "1": output += "one";',
                    '   case "2": output += "two";',
                    '   default: output += "three";',
                    '}'
                ];
                verifier = helper.verifier(__filename, code);
                cb(null);
            },
            "should cover one path": function (test) {
                verifier.verify(test, [ "1" ], "onetwothree", { lines: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }, branches: { '1': [ 1, 1, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1 } });
                test.done();
            },
            "should cover two path": function (test) {
                verifier.verify(test, [ "2" ], "twothree", { lines: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 1 }, branches: { '1': [ 0, 1, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 1, '5': 1 } });
                test.done();
            },
            "should cover unknown path": function (test) {
                verifier.verify(test, [ "4" ], "three", { lines: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 1 }, branches: { '1': [ 0, 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0, '5': 1 } });
                test.done();
            }
        },
        "and 2 cases with a default and fall-thru all on one line": {
            setUp: function (cb) {
                code = [
                    'output = "";',
                    'switch (args[0]) {' +
                        '   case "1": output += "one";' +
                        '   case "2": output += "two";' +
                        '   default: output += "three";' +
                        '}'
                ];
                verifier = helper.verifier(__filename, code);
                cb(null);
            },
            "should cover one path": function (test) {
                verifier.verify(test, [ "1" ], "onetwothree", { lines: { 1: 1, 2: 1 }, branches: { '1': [ 1, 1, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1 } });
                test.done();
            },
            "should cover two path": function (test) {
                verifier.verify(test, [ "2" ], "twothree", { lines: { 1: 1, 2: 1 }, branches: { '1': [ 0, 1, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 1, '5': 1 } });
                test.done();
            },
            "should cover unknown path": function (test) {
                verifier.verify(test, [ "4" ], "three", { lines: { 1: 1, 2: 1 }, branches: { '1': [ 0, 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0, '5': 1 } });
                test.done();
            }
        }
    }
};

