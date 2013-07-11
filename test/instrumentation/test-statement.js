/*jslint nomen: true */
var helper = require('../helper'),
    Instrumenter = require('../../lib/instrumenter'),
    code,
    verifier;

module.exports = {
    "with a simple statement": {
        setUp: function (cb) {
            code = [
                'var x = args[0] > 5 ? args[0] : "undef";',
                'output = x;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover line and one branch": function (test) {
            verifier.verify(test, [ 10 ], 10, { lines: { 1: 1, 2: 1 }, branches: { 1: [1, 0 ]}, functions: {}, statements: { 1: 1, 2: 1 } });
            test.done();
        },
        "should cover line and other branch": function (test) {
            verifier.verify(test, [ 1 ], "undef", { lines: { 1: 1, 2: 1 }, branches: { 1: [ 0, 1 ]}, functions: {}, statements: { 1: 1, 2: 1 } });
            test.done();
        }
    },
    "with no filename": {
        setUp: function (cb) {
            code = [
                'output = args[0];'
            ];
            verifier = helper.verifier(null, code, { debug: true, walkDebug: true });
            cb();
        },
        "should not barf in setup": function (test) {
            verifier.verify(test, [ 1 ], 1, { lines: { 1: 1 }, branches: {}, functions: {}, statements: { 1: 1 } });
            test.done();
        }
    },
    "with a windows style file path": {
        setUp: function (cb) {
            code = [
                'var x = args[0] > 5 ? args[0] : "undef";',
                'output = x;'
            ];
            verifier = helper.verifier("c:\\a\\b\\c\\d\\e.js", code);
            cb();
        },
        "should have correct key in coverage variable": function (test) {
            verifier.verify(test, [ 1 ], "undef", { lines: { 1: 1, 2: 1 }, branches: { 1: [ 0, 1 ]}, functions: {}, statements: { 1: 1, 2: 1 } });
            var coverage = verifier.getCoverage(),
                key = Object.keys(coverage)[0];
            test.equals("c:\\a\\b\\c\\d\\e.js", key);
            test.done();
        }

    },
    "with junk code": {
        setUp: function (cb) {
            code = [
                'output = args[0] : 1 : 2;'
            ];
            verifier = helper.verifier(null, code, { debug: true, walkDebug: true });
            cb();
        },
        "should have verification errors": function (test) {
            verifier.verifyError(test);
            test.done();
        }
    },
    "with code that is not a string": {
        "should have verification errors": function (test) {
            test.throws(function () {
                var instrumenter = new Instrumenter();
                instrumenter.instrumentSync({}, 'foo.js');
            }, Error, 'Code must be a string');
            test.done();
        }
    },
    "with shebang code": {
        setUp: function (cb) {
            code = [
                '#!/usr/bin/env node',
                'var x = args[0] > 5 ? args[0] : "undef";',
                'output = x;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should cover line and one branch": function (test) {
            verifier.verify(test, [ 10 ], 10, { lines: { 2: 1, 3: 1 }, branches: { 1: [1, 0 ]}, functions: {}, statements: { 1: 1, 2: 1 } });
            test.done();
        },
        "should cover line and other branch": function (test) {
            verifier.verify(test, [ 1 ], "undef", { lines: { 2: 1, 3: 1 }, branches: { 1: [ 0, 1 ]}, functions: {}, statements: { 1: 1, 2: 1 } });
            test.done();
        }
    },
    "with source code packed in": {
        setUp: function (cb) {
            code = [
                'var x = args[0] > 5 ? args[0] : "undef";',
                'output = x;'
            ];
            verifier = helper.verifier(__filename, code, { embedSource: true, coverageVariable: null });
            cb();
        },
        "coverage should have code packed in": function (test) {
            verifier.verifyNoError(test);
            verifier.verify(test, [ 10 ], 10, { lines: { 1: 1, 2: 1 }, branches: { 1: [1, 0 ]}, functions: {}, statements: { 1: 1, 2: 1 } });
            var cov = verifier.getCoverage(),
                fileCov = cov[Object.keys(cov)[0]];
            test.ok(fileCov.code.length > 1);
            test.ok(fileCov.code[1] === 'output = x;');
            test.done();
        }
    },
    "with code having a return statement on mainline": {
        setUp: function (cb) {
            code = [
                'return 10;'
            ];
            verifier = helper.verifier(__filename, code);
            cb();
        },

        "should pass coverage": function (test) {
            verifier.verifyNoError(test);
            test.done();
        }
    },
    "with code having a return statement on mainline and no autowrap": {
        setUp: function (cb) {
            code = [
                'return 10;'
            ];
            verifier = helper.verifier(__filename, code, { noAutoWrap: true });
            cb();
        },

        "should fail coverage": function (test) {
            verifier.verifyError(test);
            test.done();
        }
    },
    "with no mainline returns and no autowrap": {
        setUp: function (cb) {
            code = [
                '#!/usr/bin/env node',
                'var x = args[0] > 5 ? args[0] : "undef";',
                'output = x;'
            ];
            verifier = helper.verifier(__filename, code, { noAutoWrap: true });
            cb();
        },

        "should cover line and one branch": function (test) {
            verifier.verify(test, [ 10 ], 10, { lines: { 2: 1, 3: 1 }, branches: { 1: [1, 0 ]}, functions: {}, statements: { 1: 1, 2: 1 } });
            test.done();
        },
        "should cover line and other branch": function (test) {
            verifier.verify(test, [ 1 ], "undef", { lines: { 2: 1, 3: 1 }, branches: { 1: [ 0, 1 ]}, functions: {}, statements: { 1: 1, 2: 1 } });
            test.done();
        }
    }
};

