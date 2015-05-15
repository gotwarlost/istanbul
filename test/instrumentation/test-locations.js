/*jslint nomen: true */
var helper = require('../helper'),
    verifier,
    code;

/*jshint maxlen: 500 */
module.exports = {
    "with a function and if branch all in one line": {
        setUp: function (cb) {
            code = [
                'function foo() { if (true) { return "bar"; } else { return "baz"; } } output = foo();'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },
        "should report locations correctly": function (test) {
            verifier.verify(test, [], 'bar', { lines: { '1': 1 }, branches: { 1: [ 1, 0 ] }, functions: { 1: 1 }, statements: { '1': 1, '2': 1, '3': 1, '4': 0, '5': 1 }});
            var cov = verifier.getFileCoverage();
            test.deepEqual({
                "1": {
                    "name": "foo",
                        "line": 1,
                        "loc": {
                        "start": {
                            "line": 1,
                                "column": 0
                        },
                        "end": {
                            "line": 1,
                                "column": 15
                        }
                    }
                }
            }, cov.fnMap);
            test.deepEqual({
                "1": {
                    "line": 1,
                    "type": "if",
                    "locations": [
                        {
                            "start": {
                                "line": 1,
                                "column": 17
                            },
                            "end": {
                                "line": 1,
                                "column": 17
                            }
                        },
                        {
                            "start": {
                                "line": 1,
                                "column": 17
                            },
                            "end": {
                                "line": 1,
                                "column": 17
                            }
                        }
                    ]
                }
            }, cov.branchMap);
            test.deepEqual({
                "start": {
                    "line": 1,
                    "column": 0
                },
                "end": {
                    "line": 1,
                    "column": 69
                }
            }, cov.statementMap[1]);
            test.done();
        }
    },
    "with a switch statement all in one line": {
        setUp: function (cb) {
            code = [
                [
                    'output = "unknown";',
                    'switch (args[0]) {',
                    '   case "1": output = "one"; break;',
                    '   case "2": output = "two"; break;',
                    '}'
                ].join(' ')
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },
        "should report locations correctly": function (test) {
            verifier.verify(test, [ "1" ], "one", { lines: { 1: 1 }, branches: { '1': [ 1, 0 ] }, functions: {}, statements: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 0, 6: 0 } });
            var cov = verifier.getFileCoverage();
            test.deepEqual({
                "1": {
                    "line": 1,
                    "type": "switch",
                    "locations": [
                        {
                            "start": {
                                "line": 1,
                                "column": 42
                            },
                            "end": {
                                "line": 1,
                                "column": 74
                            }
                        },
                        {
                            "start": {
                                "line": 1,
                                "column": 78
                            },
                            "end": {
                                "line": 1,
                                "column": 110
                            }
                        }
                    ]
                }
            }, cov.branchMap);
            test.done();
        }
    }
};

