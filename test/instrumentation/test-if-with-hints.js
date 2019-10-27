/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

/*jshint maxlen: 500 */
module.exports = {
    "with a simple if": {
        "as a statement": {
            setUp: function (cb) {
                code = [
                    'output = -1;',
                    '/* hint */',
                    'if (args[0] > args [1])',
                    '   output = args[0];'
                ];
                cb(null);
            },
            "should cover then path": function (test) {
                code[1] = '/* istanbul ignore else */';
                verifier = helper.verifier(__filename, code);
                verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1, 3: 1, 4: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1 } });
                var cov = verifier.getFileCoverage();
                test.equal(true, cov.branchMap[1].locations[1].skip);
                test.done();
            },
            "should cover else path": function (test) {
                code[1] = '/* istanbul ignore if */';
                verifier = helper.verifier(__filename, code);
                verifier.verify(test, [ 10, 20 ], -1, { lines: { 1: 1, 3: 1, 4: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                var cov = verifier.getFileCoverage();
                test.equal(true, cov.branchMap[1].locations[0].skip);
                test.equal(true, cov.statementMap[3].skip);
                test.done();
            }
        },
        "as a block": {
            setUp: function (cb) {
                code = [
                    'output = -1;',
                    '/* hint */',
                    'if (args[0] > args [1]) {',
                    '   output = args[0];',
                    '}'
                ];
                cb();
            },
            "should cover then path": function (test) {
                code[1] = '/* istanbul ignore else */';
                verifier = helper.verifier(__filename, code);
                verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1, 3: 1, 4: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1 } });
                var cov = verifier.getFileCoverage();
                test.equal(true, cov.branchMap[1].locations[1].skip);
                test.done();
            },
            "should cover else path": function (test) {
                code[1] = '/* istanbul ignore if */';
                verifier = helper.verifier(__filename, code);
                verifier.verify(test, [ 10, 20 ], -1, { lines: { 1: 1, 3: 1, 4: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                var cov = verifier.getFileCoverage();
                test.equal(true, cov.branchMap[1].locations[0].skip);
                test.equal(true, cov.statementMap[3].skip);
                test.done();
            }
        },
        "on a single line": {
            "as statement": {
                setUp: function (cb) {
                    code = [
                        'output = -1;',
                        '/* hint */',
                        'if (args[0] > args [1]) output = args[0];'
                    ];
                    cb();
                },
                "should cover then path": function (test) {
                    code[1] = '/* istanbul ignore else */';
                    verifier = helper.verifier(__filename, code);
                    verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1, 3: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1 } });
                    var cov = verifier.getFileCoverage();
                    test.equal(true, cov.branchMap[1].locations[1].skip);
                    test.done();
                },
                "should cover else path": function (test) {
                    code[1] = '/* istanbul ignore if */';
                    verifier = helper.verifier(__filename, code);
                    verifier.verify(test, [ 10, 20 ], -1, { lines: { 1: 1, 3: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                    var cov = verifier.getFileCoverage();
                    test.equal(true, cov.branchMap[1].locations[0].skip);
                    test.equal(true, cov.statementMap[3].skip);
                    test.done();
                }
            },
            "as block": {
                setUp: function (cb) {
                    code = [
                        'output = -1;',
                        '/* hint */',
                        'if (args[0] > args [1]) { output = args[0]; }'
                    ];
                    cb();
                },
                "should cover then path": function (test) {
                    code[1] = '/* istanbul ignore else */';
                    verifier = helper.verifier(__filename, code);
                    verifier.verify(test, [ 20, 10 ], 20, { lines: { 1: 1, 3: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 1 } });
                    var cov = verifier.getFileCoverage();
                    test.equal(true, cov.branchMap[1].locations[1].skip);
                    test.done();
                },
                "should cover else path": function (test) {
                    code[1] = '/* istanbul ignore if */';
                    verifier = helper.verifier(__filename, code);
                    verifier.verify(test, [ 10, 20 ], -1, { lines: { 1: 1, 3: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                    var cov = verifier.getFileCoverage();
                    test.equal(true, cov.branchMap[1].locations[0].skip);
                    test.equal(true, cov.statementMap[3].skip);
                    test.done();
                },
                "should skip if statement completely": function (test) {
                    code[1] = '/* istanbul ignore next */';
                    verifier = helper.verifier(__filename, code);
                    verifier.verify(test, [ 10, 20 ], -1, { lines: { 1: 1, 3: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                    var cov = verifier.getFileCoverage();
                    test.equal(true, cov.branchMap[1].locations[0].skip);
                    test.equal(true, cov.branchMap[1].locations[1].skip);
                    test.equal(true, cov.statementMap[3].skip);
                    test.done();
                }
            }
        }
    },
    "with a simple if-else": {
        "as a statement": {
            setUp: function (cb) {
                code = [
                    '// hint',
                    'if (args[0] > args[1])',
                    '   output = args[0];',
                    'else',
                    '   output = args[1];'
                ];
                cb(null);
            },
            "should cover then path": function (test) {
                code[0] = '// istanbul ignore else';
                verifier = helper.verifier(__filename, code);
                verifier.verify(test, [ 20, 10 ], 20, { lines: { 2: 1, 3: 1, 5: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { '1': 1, '2': 1, '3': 0 } });
                var cov = verifier.getFileCoverage();
                test.equal(true, cov.branchMap[1].locations[1].skip);
                test.equal(true, cov.statementMap[3].skip);
                test.done();
            },
            "should cover else path": function (test) {
                code[0] = '// istanbul ignore if ';
                verifier = helper.verifier(__filename, code);
                verifier.verify(test, [ 10, 20 ], 20, { lines: { 2: 1, 3: 1, 5: 1 }, branches: { '1': [ 0, 1 ] }, functions: {}, statements: { '1': 1, '2': 0, '3': 1 } });
                var cov = verifier.getFileCoverage();
                test.equal(true, cov.branchMap[1].locations[0].skip);
                test.equal(true, cov.statementMap[2].skip);
                test.done();
            }
        }
    },
    "with if-elseif-else": {
        "as a statement": {
            setUp: function(cb) {
                code = [
                    '// hint',
                    'if (args[0] > args[1]) {',
                    '   output = args[0];',
                    '} else if (args[0] < args[1]) {',
                    '   output = args[1];',
                    '} else if (args[0] > args[1]) {',
                    '   output = args[0];',
                    '} else {',
                    '   output = null;',
                    '}',
                ];
                cb(null);
            },
            "should cover then and elseif path": function (test) {
                // without hint
                verifier = helper.verifier(__filename, code);
                verifier.verify(
                    test,
                    [ 10, 11 ],
                    11,
                    {
                      lines: { 2: 1, 3: 0, 4: 1, 5: 1, 6: 0, 7: 0, 9: 0 },
                      branches: { 1: [ 0, 1 ], 2: [ 1, 0 ], 3: [ 0, 0 ] },
                      functions: {},
                      statements: { 1: 1, 2: 0, 3: 1, 4: 1, 5: 0, 6: 0, 7: 0 },
                    }
                );

                // with hint ignoring last else
                code[0] = '// istanbul ignore last-else';
                verifier = helper.verifier(__filename, code);
                verifier.verify(
                    test,
                    [ 10, 11 ],
                    11,
                    {
                      lines: { 2: 1, 3: 0, 4: 1, 5: 1, 6: 0, 7: 0, 9: 1 },
                      branches: { 1: [ 0, 1 ], 2: [ 1, 0 ], 3: [ 0, 0 ] },
                      functions: {},
                      statements: { 1: 1, 2: 0, 3: 1, 4: 1, 5: 0, 6: 0, 7: 0 },
                    }
                );
                var cov = verifier.getFileCoverage();
                test.equal(true, cov.branchMap[3].locations[1].skip);
                test.equal(true, cov.statementMap[7].skip);
                test.done();
            }
        }
    },
    "as a nested if statement": {
        setUp: function(cb) {
            code = [
                '// hint',
                'if (args[0] >= args[1]) {',
                '    if ( args[0] === args[1]) {',
                '        output = -1;',
                '    } else {',
                '        output = args[0];',
                '    }',
                '} else if (args[0] < args[1]) {',
                '    output = args[1];',
                '} else {',
                '   output = null;',
                '}',
            ];
            cb(null);
        },
        "should should ignore last else": function (test) {
            verifier = helper.verifier(__filename, code);
            verifier.verify(
                test,
                [ 10, 10 ],
                -1,
                {
                  lines: { 2: 1, 3: 1, 4: 1, 6: 0, 8: 0, 9: 0, 11: 0 },
                  branches: { 1: [ 1, 0 ], 2: [ 1, 0 ], 3: [ 0, 0 ] },
                  functions: {},
                  statements: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0 },
                }
            );

            code[0] = '// istanbul ignore last-else';
            verifier = helper.verifier(__filename, code);
            verifier.verify(
                test,
                [ 10, 10 ],
                -1,
                {
                  lines: { 2: 1, 3: 1, 4: 1, 6: 0, 8: 0,  9: 0, 11: 1 },
                  branches: { 1: [ 1, 0 ], 2: [ 1, 0 ], 3: [ 0, 0 ] },
                  functions: {},
                  statements: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0 },
                }
            );
            var cov = verifier.getFileCoverage();
            test.equal(true, cov.statementMap[7].skip);
            test.equal(true, cov.branchMap[3].locations[1].skip);
            test.done();
        }
    }
};

