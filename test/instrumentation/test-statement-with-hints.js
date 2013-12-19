/*jslint nomen: true */
var helper = require('../helper'),
    code,
    verifier;

module.exports = {
    "with a simple statement": {
        setUp: function (cb) {
            code = [
                '/* istanbul ignore next */',
                'var x = args[0] > 5 ? args[0] : "undef";',
                'output = x;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover line and one branch": function (test) {
            verifier.verify(test, [ 10 ], 10, { lines: { 2: 1, 3: 1 }, branches: { 1: [1, 0 ]}, functions: {}, statements: { 1: 1, 2: 1 } });
            var cov = verifier.getFileCoverage();
            test.equal(true, cov.statementMap[1].skip);
            test.equal(true, cov.branchMap[1].locations[0].skip);
            test.equal(true, cov.branchMap[1].locations[1].skip);
            test.done();
        }
    },
    "with a function declaration": {
        setUp: function (cb) {
            code = [
                '/* istanbul ignore next */',
                'function foo(x) { return x; }',
                'output = args[0];'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should not cover function call": function (test) {
            verifier.verify(test, [ 10 ], 10, { lines: { 2: 1, 3: 1 }, branches: {}, functions: { 1: 0 }, statements: { 1: 1, 2: 0, 3: 1 } });
            var cov = verifier.getFileCoverage();
            test.equal(true, cov.statementMap[1].skip);
            test.equal(true, cov.statementMap[2].skip);
            test.equal(true, cov.fnMap[1].skip);
            test.done();
        }
    },
    "with a function expression": {
        setUp: function (cb) {
            code = [
                '/* istanbul ignore next */',
                '(function () { output = args[0]; })();'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover function call": function (test) {
            verifier.verify(test, [ 10 ], 10, { lines: { 2: 1  }, branches: {}, functions: { 1: 1 }, statements: { 1: 1, 2: 1 } });
            var cov = verifier.getFileCoverage();
            test.equal(true, cov.statementMap[1].skip);
            test.equal(true, cov.statementMap[2].skip);
            test.equal(true, cov.fnMap[1].skip);
            test.done();
        }
    },
    "with a disabled switch statement": {
        setUp: function (cb) {
            code = [
                '/* istanbul ignore next */',
                'switch (args[0]) {',
                'case "1": output = 2; break;',
                'default: output = 1;',
                '}'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should ignore all branches": function (test) {
            verifier.verify(test, [ "1" ], 2, { lines: { 2: 1, 3: 1, 4: 1  }, branches: { 1: [ 1, 0 ]},
                functions: {}, statements: { 1: 1, 2: 1, 3: 1, 4: 0 } });
            var cov = verifier.getFileCoverage();
            test.equal(true, cov.statementMap[1].skip);
            test.equal(true, cov.statementMap[2].skip);
            test.equal(true, cov.statementMap[3].skip);
            test.equal(true, cov.statementMap[4].skip);
            test.equal(true, cov.branchMap[1].locations[0].skip);
            test.equal(true, cov.branchMap[1].locations[1].skip);
            test.done();
        }
    },
    "with a disabled case statement": {
        setUp: function (cb) {
            code = [
                'switch (args[0]) {',
                '/* istanbul ignore next */',
                'case "1": output = 2; break;',
                'default: output = 1;',
                '}'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should ignore specific case": function (test) {
            verifier.verify(test, [ "2" ], 1, { lines: { 1: 1, 3: 1, 4: 1  }, branches: { 1: [ 0, 1 ]},
                functions: {}, statements: { 1: 1, 2: 0, 3: 0, 4: 1 } });
            var cov = verifier.getFileCoverage();
            test.equal(true, cov.branchMap[1].locations[0].skip);
            test.equal(true, cov.statementMap[2].skip);
            test.equal(true, cov.statementMap[3].skip);
            test.done();
        }
    },

    "with disabled conditional statement": {
        setUp: function (cb) {
            code = [
                '/* istanbul ignore next */',
                'output = args[0] === 1 ? 1: 0;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should ignore conditions": function (test) {
            verifier.verify(test, [ 2 ], 0, { lines: { 2: 1  }, branches: { 1: [ 0, 1 ]},
                functions: {}, statements: { 1: 1 } });
            var cov = verifier.getFileCoverage();
            test.equal(true, cov.branchMap[1].locations[0].skip);
            test.equal(true, cov.branchMap[1].locations[1].skip);
            test.equal(true, cov.statementMap[1].skip);
            test.done();
        }

    },
    "with disabled condition": {
        setUp: function (cb) {
            code = [
                'output = args[0] === 1 ? /* istanbul ignore next */ 1 : 0;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should ignore conditions": function (test) {
            verifier.verify(test, [ 2 ], 0, { lines: { 1: 1  }, branches: { 1: [ 0, 1 ]},
                functions: {}, statements: { 1: 1 } });
            var cov = verifier.getFileCoverage();
            test.equal(true, cov.branchMap[1].locations[0].skip);
            test.equal(undefined, cov.branchMap[1].locations[1].skip);
            test.equal(undefined, cov.statementMap[1].skip);
            test.done();
        }
    },

    "with a simple logical expression": {
        setUp: function (cb) {
            code = [
                'if (args[0] === 1  || /* istanbul ignore next */ args[0] === 2 ) {',
                '   output = args[0] + 10;',
                '} else {',
                '   output = 20;',
                '}'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should ignore conditions": function (test) {
            verifier.verify(test, [ 1 ], 11, { lines: { 1: 1, 2: 1, 4: 0 }, branches: { 1: [ 1, 0 ], 2: [ 1, 0 ] },
                functions: {}, statements: { 1: 1, 2: 1, 3: 0 } });
            var cov = verifier.getFileCoverage();
            test.equal(true, cov.branchMap[2].locations[1].skip);
            test.done();
        }
    },

    "with a slightly complicated logical expression": {
        setUp: function (cb) {
            code = [
                'if (args[0] === 1  || /* istanbul ignore next */ (args[0] === 2  || args[0] === 3)) {',
                '   output = args[0] + 10;',
                '} else {',
                '   output = 20;',
                '}'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should ignore conditions": function (test) {
            verifier.verify(test, [ 1 ], 11, { lines: { 1: 1, 2: 1, 4: 0 }, branches: { 1: [ 1, 0 ], 2: [ 1, 0, 0 ] },
                functions: {}, statements: { 1: 1, 2: 1, 3: 0 } });
            var cov = verifier.getFileCoverage();
            test.equal(undefined, cov.branchMap[2].locations[0].skip);
            test.equal(true, cov.branchMap[2].locations[1].skip);
            test.equal(true, cov.branchMap[2].locations[2].skip);
            test.done();
        }
    },

    "with a complicated logical expression involving implied operator precedence": {
        setUp: function (cb) {
            code = [
                'if (args[0] === 1  || /* istanbul ignore next */ args[0] === 2  && args[1] === 2) {',
                '   output = args[0] + 10;',
                '} else {',
                '   output = 20;',
                '}'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should ignore conditions": function (test) {
            verifier.verify(test, [ 1, 1 ], 11, { lines: { 1: 1, 2: 1, 4: 0 }, branches: { 1: [ 1, 0 ], 2: [ 1, 0, 0 ] },
                functions: {}, statements: { 1: 1, 2: 1, 3: 0 } });
            var cov = verifier.getFileCoverage();
            test.equal(undefined, cov.branchMap[2].locations[0].skip);
            test.equal(true, cov.branchMap[2].locations[1].skip);
            test.equal(true, cov.branchMap[2].locations[2].skip);
            test.done();
        }
    }
};
