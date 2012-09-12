/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;
module.exports = {
    "with a simple if": {
        "as a statement": {
            setUp: function (cb) {
                code = [
                    'output = -1;',
                    'if (args[0] > args [1])',
                    '   output = args[0];'
                ];
                verifier = helper.verifier(__filename, code);
                cb(null);
            },
            "should cover then path": function (test) {
                verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1, 2: 1, 3: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1 } });
                test.done();
            },
            "should cover else path": function (test) {
                verifier.verify(test, [ 10, 20 ], -1, { lines: { 1: 1, 2: 1, 3: 0 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                test.done();
            }
        },
        "as a block": {
            setUp: function (cb) {
                code = [
                    'output = -1;',
                    'if (args[0] > args [1]) {',
                    '   output = args[0];',
                    '}'
                ];
                verifier = helper.verifier(__filename, code);
                cb();
            },
            "should cover then path": function (test) {
                verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1, 2: 1, 3: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1 } });
                test.done();
            },
            "should cover else path": function (test) {
                verifier.verify(test, [ 10, 20 ], -1, { lines: { 1: 1, 2: 1, 3: 0 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                test.done();
            }
        },
        "on a single line": {
            "as statement": {
                setUp: function (cb) {
                    code = [
                        'output = -1;',
                        'if (args[0] > args [1]) output = args[0];'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover then path": function (test) {
                    verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1 } });
                    test.done();
                },
                "should cover else path": function (test) {
                    verifier.verify(test, [ 10, 20 ], -1, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                    test.done();
                }
            },
            "as block": {
                setUp: function (cb) {
                    code = [
                        'output = -1;',
                        'if (args[0] > args [1]) { output = args[0]; }'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover then path": function (test) {
                    verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1 } });
                    test.done();
                },
                "should cover else path": function (test) {
                    verifier.verify(test, [ 10, 20 ], -1, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                    test.done();
                }
            }
        }
    },
    "with a simple if-else": {
        "as a statement": {
            setUp: function (cb) {
                code = [
                    'if (args[0] > args [1])',
                    '   output = args[0];',
                    'else',
                    '   output = args[1];'
                ];
                verifier = helper.verifier(__filename, code);
                cb(null);
            },
            "should cover then path": function (test) {
                verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1, 2: 1, 4: 0 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                test.done();
            },
            "should cover else path": function (test) {
                verifier.verify(test, [ 10, 20 ], 20, { lines: { 1: 1, 2: 0, 4: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1 } });
                test.done();
            }
        },
        "as a block": {
            setUp: function (cb) {
                code = [
                    'if (args[0] > args [1]) {',
                    '   output = args[0];',
                    '} else {',
                    '   output = args[1];',
                    '}'
                ];
                verifier = helper.verifier(__filename, code);
                cb();
            },
            "should cover then path": function (test) {
                verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1, 2: 1, 4: 0 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                test.done();
            },
            "should cover else path": function (test) {
                verifier.verify(test, [ 10, 20 ], 20, { lines: { 1: 1, 2: 0, 4: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1 } });
                test.done();
            }
        },
        "on a single line": {
            "as statement": {
                setUp: function (cb) {
                    code = [
                        'if (args[0] > args [1]) output = args[0]; else output = args[1];'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover then path": function (test) {
                    verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                    test.done();
                },
                "should cover else path": function (test) {
                    verifier.verify(test, [ 10, 20 ], 20, { lines: { 1: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1 } });
                    test.done();
                }
            },
            "as block": {
                setUp: function (cb) {
                    code = [
                        'if (args[0] > args [1]) { output = args[0]; } else { output = args[1]; }'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover then path": function (test) {
                    verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                    test.done();
                },
                "should cover else path": function (test) {
                    verifier.verify(test, [ 10, 20 ], 20, { lines: { 1: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1 } });
                    test.done();
                }
            },
            "as mixed with then-block": {
                setUp: function (cb) {
                    code = [
                        'if (args[0] > args [1]) { output = args[0]; } else output = args[1];'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover then path": function (test) {
                    verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                    test.done();
                },
                "should cover else path": function (test) {
                    verifier.verify(test, [ 10, 20 ], 20, { lines: { 1: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1 } });
                    test.done();
                }
            },
            "as mixed with else-block": {
                setUp: function (cb) {
                    code = [
                        'if (args[0] > args [1]) output = args[0]; else { output = args[1]; }'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover then path": function (test) {
                    verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                    test.done();
                },
                "should cover else path": function (test) {
                    verifier.verify(test, [ 10, 20 ], 20, { lines: { 1: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1 } });
                    test.done();
                }
            }
        }
    },
    "with nested ifs": {
        "without an else": {
            "and no blocks": {
                setUp: function (cb) {
                    code = [
                        'output = -1;',
                        'if (args[0] > args[1]) if (args[1] > args[2]) output = args[2];'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover first else and nothing below": function (test) {
                    verifier.verify(test, [ 10, 20, 15 ], -1, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 0, 1 ], '2' : [ 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0 } });
                    test.done();
                },
                "should cover first then": function (test) {
                    verifier.verify(test, [ 20, 10, 15 ], -1, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 1, 0 ], '2' : [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 0 } });
                    test.done();
                },
                "should cover first then and second then": function (test) {
                    verifier.verify(test, [ 20, 10, 5 ], 5, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 1, 0 ], '2' : [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 1 } });
                    test.done();
                }
            },
            "and blocks": {
                setUp: function (cb) {
                    code = [
                        'output = -1;',
                        'if (args[0] > args[1]) { if (args[1] > args[2]) { output = args[2]; } }'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover first else and nothing below": function (test) {
                    verifier.verify(test, [ 10, 20, 15 ], -1, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 0, 1 ], '2' : [ 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0 } });
                    test.done();
                },
                "should cover first then": function (test) {
                    verifier.verify(test, [ 20, 10, 15 ], -1, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 1, 0 ], '2' : [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 0 } });
                    test.done();
                },
                "should cover first then and second then": function (test) {
                    verifier.verify(test, [ 20, 10, 5 ], 5, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 1, 0 ], '2' : [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 1 } });
                    test.done();
                }
            }
        },
        "with elses": {
            "and no blocks": {
                setUp: function (cb) {
                    code = [
                        'output = -1;',
                        'if (args[0] > args[1]) if (args[1] > args[2]) output = args[2]; else output = args[1];'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover first else and nothing below": function (test) {
                    verifier.verify(test, [ 10, 20, 15 ], -1, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 0, 1 ], '2' : [ 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0, '5': 0 } });
                    test.done();
                },
                "should cover first then": function (test) {
                    verifier.verify(test, [ 20, 10, 15 ], 10, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 1, 0 ], '2' : [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 0, '5': 1 } });
                    test.done();
                },
                "should cover first then and second then": function (test) {
                    verifier.verify(test, [ 20, 10, 5 ], 5, { lines: { 1: 1, 2: 1 }, branches: { '1': [ 1, 0 ], '2' : [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 0 } });
                    test.done();
                }
            },
            "including else ifs with blocks": {
                setUp: function (cb) {
                    code = [
                        'if (args[0] < args[1]) {',
                        '    output = args[0];',
                        '} else if (args[1] < args[2]) {',
                        '    output = args[1];',
                        '} else if (args[2] < args[3]) {',
                        '    output = args[2];',
                        '} else {',
                        '    output = args[3];',
                        '}'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover all else paths": function (test) {
                    verifier.verify(test, [ 4, 3, 2, 1 ], 1, { lines: { 1: 1, 2: 0, 3: 1, 4: 0, 5: 1, 6: 0, 8: 1 }, branches: { '1': [ 0, 1 ], '2' : [ 0, 1 ], '3': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1, '4': 0, '5': 1, '6': 0, '7': 1 } });
                    test.done();
                },
                "should cover one then path": function (test) {
                    verifier.verify(test, [ 4, 3, 1, 2 ], 1, { lines: { 1: 1, 2: 0, 3: 1, 4: 0, 5: 1, 6: 1, 8: 0 }, branches: { '1': [ 0, 1 ], '2' : [ 0, 1 ], '3': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1, '4': 0, '5': 1, '6': 1, '7': 0 } });
                    test.done();
                },
                "should cover upper then paths": function (test) {
                    verifier.verify(test, [ 4, 2, 3, 1 ], 2, { lines: { 1: 1, 2: 0, 3: 1, 4: 1, 5: 0, 6: 0, 8: 0 }, branches: { '1': [ 0, 1 ], '2' : [ 1, 0 ], '3': [ 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1, '4': 1, '5': 0, '6': 0, '7': 0 } });
                    test.done();
                },
                "should cover uppermost then paths": function (test) {
                    verifier.verify(test, [ 1, 2, 3, 1 ], 1, { lines: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 8: 0 }, branches: { '1': [ 1, 0 ], '2' : [ 0, 0 ], '3': [ 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 } });
                    test.done();
                }
            },
            "including else ifs without blocks": {
                setUp: function (cb) {
                    code = [
                        'if (args[0] < args[1])',
                        '    output = args[0];',
                        'else if (args[1] < args[2])',
                        '    output = args[1];',
                        'else if (args[2] < args[3])',
                        '    output = args[2];',
                        'else',
                        '    output = args[3];'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover all else paths": function (test) {
                    verifier.verify(test, [ 4, 3, 2, 1 ], 1, { lines: { 1: 1, 2: 0, 3: 1, 4: 0, 5: 1, 6: 0, 8: 1 }, branches: { '1': [ 0, 1 ], '2' : [ 0, 1 ], '3': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1, '4': 0, '5': 1, '6': 0, '7': 1 } });
                    test.done();
                },
                "should cover one then path": function (test) {
                    verifier.verify(test, [ 4, 3, 1, 2 ], 1, { lines: { 1: 1, 2: 0, 3: 1, 4: 0, 5: 1, 6: 1, 8: 0 }, branches: { '1': [ 0, 1 ], '2' : [ 0, 1 ], '3': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1, '4': 0, '5': 1, '6': 1, '7': 0 } });
                    test.done();
                },
                "should cover upper then paths": function (test) {
                    verifier.verify(test, [ 4, 2, 3, 1 ], 2, { lines: { 1: 1, 2: 0, 3: 1, 4: 1, 5: 0, 6: 0, 8: 0 }, branches: { '1': [ 0, 1 ], '2' : [ 1, 0 ], '3': [ 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1, '4': 1, '5': 0, '6': 0, '7': 0 } });
                    test.done();
                },
                "should cover uppermost then paths": function (test) {
                    verifier.verify(test, [ 1, 2, 3, 1 ], 1, { lines: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 8: 0 }, branches: { '1': [ 1, 0 ], '2' : [ 0, 0 ], '3': [ 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 } });
                    test.done();
                }
            },
            "including else ifs without blocks (compact)": {
                setUp: function (cb) {
                    code = [
                        'if (args[0] < args[1]) output = args[0]; else if (args[1] < args[2]) output = args[1]; else if (args[2] < args[3]) output = args[2]; else output = args[3];'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover all else paths": function (test) {
                    verifier.verify(test, [ 4, 3, 2, 1 ], 1, { lines: { 1: 1 }, branches: { '1': [ 0, 1 ], '2' : [ 0, 1 ], '3': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1, '4': 0, '5': 1, '6': 0, '7': 1 } });
                    test.done();
                },
                "should cover one then path": function (test) {
                    verifier.verify(test, [ 4, 3, 1, 2 ], 1, { lines: { 1: 1 }, branches: { '1': [ 0, 1 ], '2' : [ 0, 1 ], '3': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1, '4': 0, '5': 1, '6': 1, '7': 0 } });
                    test.done();
                },
                "should cover upper then paths": function (test) {
                    verifier.verify(test, [ 4, 2, 3, 1 ], 2, { lines: { 1: 1 }, branches: { '1': [ 0, 1 ], '2' : [ 1, 0 ], '3': [ 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1, '4': 1, '5': 0, '6': 0, '7': 0 } });
                    test.done();
                },
                "should cover uppermost then paths": function (test) {
                    verifier.verify(test, [ 1, 2, 3, 1 ], 1, { lines: { 1: 1 }, branches: { '1': [ 1, 0 ], '2' : [ 0, 0 ], '3': [ 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 } });
                    test.done();
                }
            },
            "including else ifs without blocks (modified)": {
                setUp: function (cb) {
                    code = [
                        'output = args[3]; if (args[0] < args[1])',
                        '    output = args[0];',
                        'else if (args[1] < args[2])',
                        '    output = args[1];',
                        'else if (args[2] < args[3])',
                        '    output = args[2];'
                    ];
                    verifier = helper.verifier(__filename, code);
                    cb();
                },
                "should cover all else paths": function (test) {
                    verifier.verify(test, [ 4, 3, 2, 1 ], 1, { lines: { 1: 1, 2: 0, 3: 1, 4: 0, 5: 1, 6: 0 }, branches: { '1': [ 0, 1 ], '2' : [ 0, 1 ], '3': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 1, '5': 0, '6': 1, '7': 0 } });
                    test.done();
                },
                "should cover one then path": function (test) {
                    verifier.verify(test, [ 4, 3, 1, 2 ], 1, { lines: { 1: 1, 2: 0, 3: 1, 4: 0, 5: 1, 6: 1 }, branches: { '1': [ 0, 1 ], '2' : [ 0, 1 ], '3': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 1, '5': 0, '6': 1, '7': 1 } });
                    test.done();
                },
                "should cover upper then paths": function (test) {
                    verifier.verify(test, [ 4, 2, 3, 1 ], 2, { lines: { 1: 1, 2: 0, 3: 1, 4: 1, 5: 0, 6: 0 }, branches: { '1': [ 0, 1 ], '2' : [ 1, 0 ], '3': [ 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0, '4': 1, '5': 1, '6': 0, '7': 0 } });
                    test.done();
                },
                "should cover uppermost then paths": function (test) {
                    verifier.verify(test, [ 1, 2, 3, 1 ], 1, { lines: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0 }, branches: { '1': [ 1, 0 ], '2' : [ 0, 0 ], '3': [ 0, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1, '4': 0, '5': 0, '6': 0, '7': 0 } });
                    test.done();
                }
            }
        }
    }
};

