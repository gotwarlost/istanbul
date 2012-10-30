/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    mkdirp = require('mkdirp'),
    async = require('async'),
    fs = require('fs'),
    filesFor = require('../util/file-matcher').filesFor,
    nopt = require('nopt'),
    Instrumenter = require('../instrumenter'),
    inputError = require('../util/input-error'),
    formatOption = require('../util/help-formatter').formatOption,
    util = require('util'),
    Command = require('./index'),
    verbose;

function processFiles(instrumenter, inputDir, outputDir, relativeNames) {
    var processor = function (name, callback) {
            var inputFile = path.resolve(inputDir, name),
                outputFile = path.resolve(outputDir, name),
                oDir = path.dirname(outputFile);

            mkdirp.sync(oDir);
            fs.readFile(inputFile, 'utf8', function (err, data) {
                if (err) { return callback(err, name); }
                instrumenter.instrument(data, inputFile, function (iErr, instrumented) {
                    if (iErr) { return callback(iErr, name); }
                    fs.writeFile(outputFile, instrumented, 'utf8', function (err) {
                        return callback(err, name);
                    });
                });
            });
        },
        q = async.queue(processor, 10),
        errors = [],
        count = 0,
        startTime = new Date().getTime();

    q.push(relativeNames, function (err, name) {
        var inputFile, outputFile;
        if (err) {
            errors.push({ file: name, error: err.message || err.toString() });
            inputFile = path.resolve(inputDir, name);
            outputFile = path.resolve(outputDir, name);
            fs.writeFileSync(outputFile, fs.readFileSync(inputFile));
        }
        if (verbose) {
            console.log('Processed: ' + name);
        } else {
            if (count % 100 === 0) { process.stdout.write('.'); }
        }
        count += 1;
    });

    q.drain = function () {
        var endTime = new Date().getTime();
        console.log('\nProcessed [' + count + '] files in ' + Math.floor((endTime - startTime) / 1000) + ' secs');
        if (errors.length > 0) {
            console.log('The following ' + errors.length + ' file(s) had errors and were copied as-is');
            console.log(errors);
        }
    };
}


function InstrumentCommand() {
    Command.call(this);
}

InstrumentCommand.TYPE = 'instrument';
util.inherits(InstrumentCommand, Command);

Command.mix(InstrumentCommand, {
    synopsis: function synopsis() {
        return "instruments a file or a directory tree and writes the instrumented code to the desired output location";
    },

    usage: function () {
        console.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' <options> <file-or-directory>\n\nOptions are:\n\n' +
            [
                formatOption('--output <file-or-dir>', 'The output file or directory. This is required when the input is a directory, ' +
                    'defaults to standard output when input is a file'),
                formatOption('-x <exclude-pattern> [-x <exclude-pattern>]', 'one or more fileset patterns (e.g. "**/vendor/**" to ignore all files ' +
                    'under a vendor directory). Also see the --default-excludes option'),
                formatOption('--variable <global-coverage-variable-name>', 'change the variable name of the global coverage variable from the ' +
                    'default value of `__coverage__` to something else'),
                formatOption('--embed-source', 'embed source code into the coverage object, defaults to false'),
                formatOption('--[no-]compact', 'produce [non]compact output, defaults to compact')
            ].join('\n\n') + '\n');
        console.error('\n');
    },

    run: function (args, callback) {

        var config = {
                output: path,
                x: [Array, String],
                variable: String,
                compact: Boolean,
                verbose: Boolean,
                'embed-source': Boolean
            },
            opts = nopt(config, { v : '--verbose' }, args, 0),
            cmdArgs = opts.argv.remain,
            file,
            stats,
            stream,
            instrumenter = new Instrumenter({ coverageVariable: opts.variable });

        verbose = opts.verbose;
        if (cmdArgs.length !== 1) {
            return callback(inputError.create('Need exactly one filename/ dirname argument for the instrument command!'));
        }
        if (typeof opts.compact === 'undefined') {
            opts.compact = true;
        }

        instrumenter = new Instrumenter({
            coverageVariable: opts.variable,
            embedSource: opts['embed-source'],
            noCompact: !opts.compact
        });

        file = path.resolve(cmdArgs[0]);
        stats = fs.statSync(file);
        if (stats.isDirectory()) {
            if (!opts.output) { return callback(inputError.create('Need an output directory [-o <dir>] when input is a directory!')); }
            if (opts.output === file) { return callback(inputError.create('Cannot instrument into the same directory/ file as input!')); }
            mkdirp.sync(opts.output);
            filesFor({
                root: file,
                includes: ['**/*.js'],
                excludes: opts.x || ['**/node_modules/**'],
                relative: true
            }, function (err, files) {
                if (err) { return callback(err); }
                processFiles(instrumenter, file, opts.output, files);
            });
        } else {
            if (opts.output) {
                stream = fs.createWriteStream(opts.output);
            } else {
                stream = process.stdout;
            }
            stream.write(instrumenter.instrumentSync(fs.readFileSync(file, 'utf8'), file));
            try { stream.end(); } catch (ex) {}
        }
    }
});

module.exports = InstrumentCommand;

