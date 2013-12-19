/*jslint nomen: true */
var Instrumenter = require('../lib/instrumenter'),
    vm = require('vm'),
    NO_OP = function () {},
    utils = require('../lib/object-utils');


function Verifier(opts) {
    this.file = opts.file;
    this.fn = opts.fn;
    this.code = opts.code;
    this.generatedCode = opts.generatedCode;
    this.err = opts.err;
    this.debug = opts.debug;
    this.coverageVariable = opts.coverageVariable || '__coverage__';
}

function pad(str, len) {
    var blanks = '                                             ';
    if (str.length >= len) {
        return str;
    }
    return blanks.substring(0, len - str.length) + str;
}

function annotatedCode(code) {
    var line = 0,
        annotated = code.map(function (str) { line += 1; return pad(line, 6) + ': ' + str; });
    return annotated.join('\n');
}

Verifier.prototype = {

    verify: function (test, args, expectedOutput, expectedCoverage) {

        if (this.err) {
            test.ok(false, "Cannot call verify when errors present");
            return;
        } else if (this.fn === NO_OP) {
            test.ok(false, "Cannot call verify for noop");
            return;
        }
        var actualOutput = this.fn(args),
            fullCov = global[this.coverageVariable],
            cov = fullCov[Object.keys(fullCov)[0]];

        utils.addDerivedInfo(global[this.coverageVariable]);
        test.ok(cov && typeof cov === 'object', 'No coverage found for [' + this.file + ']');
        test.deepEqual(expectedOutput, actualOutput, 'Output mismatch');
        test.deepEqual(expectedCoverage.lines, cov.l, 'Line coverage mismatch');
        test.deepEqual(expectedCoverage.functions, cov.f, 'Function coverage mismatch');
        test.deepEqual(expectedCoverage.branches, cov.b, 'Branch coverage mismatch');
        test.deepEqual(expectedCoverage.statements, cov.s, 'Statement coverage mismatch');
    },

    getCoverage: function () {
        return global[this.coverageVariable];
    },

    getFileCoverage: function () {
        var cov = this.getCoverage();
        return cov[Object.keys(cov)[0]];
    },

    verifyError: function (test) {
        test.ok(this.err && typeof this.err === 'object', 'Error should be an object');
    },

    verifyNoError: function (test) {
        test.ok(!(this.err && typeof this.err === 'object'), 'Error should not be present');
    }
};

function setup(file, codeArray, opts) {

    opts = opts || {};
    opts.file = file;
    opts.debug = opts.debug || process.env.DEBUG;

    var expectError = opts.expectError,
        //exercise the case where RE substitutions for the preamble have $ signs
        coverageVariable = typeof opts.coverageVariable === 'undefined' ? '$$coverage$$' : opts.coverageVariable,
        ps = opts.embedSource || false,
        pc = opts.preserveComments || false,
        verifier,
        cover = new Instrumenter({
            debug: opts.debug,
            walkDebug: opts.walkDebug,
            noAutoWrap: opts.noAutoWrap,
            coverageVariable: coverageVariable,
            embedSource: ps,
            preserveComments: pc
        }),
        args = [ codeArray.join("\n")],
        callback = function (err, generated) {
            if (err) {
                if (expectError) {
                    verifier = new Verifier({ debug: opts.debug, file: file, fn: NO_OP, code: codeArray });
                } else {
                    console.error(err);
                    console.error(err.stack);
                    verifier = new Verifier({ debug: opts.debug, file: file, err: err, code: codeArray });
                }
                return;
            }
            var wrappedCode = '(function (args) { var output;\n' + generated + '\nreturn output;\n})',
                fn;
            global[coverageVariable] = undefined;
            fn = vm.runInThisContext(wrappedCode, __filename);
            verifier = new Verifier({ debug: opts.debug, file: file, fn: fn, code: codeArray,
                generatedCode: generated, coverageVariable: coverageVariable });
            if (opts.debug) {
                console.log('================== Original ============================================');
                console.log(annotatedCode(codeArray));
                console.log('================== Generated ===========================================');
                console.log(generated);
                console.log('========================================================================');
            }
        };

    if (file) { args.push(file); }
    args.push(callback);
    delete opts.expectError;
    cover.instrument.apply(cover, args);

    return verifier;
}

exports.verifier = setup;
