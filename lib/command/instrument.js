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
    Collector = require('../collector'),
    flowControl = require('../util/flow-control'),
    verbose;


/**
 * Chunk file size to use when reading non JavaScript files in memory
 * and copying them over when using complete-copy flag.
 */
var READ_FILE_CHUNK_SIZE = 64 * 1024;

function BaselineCollector(instrumenter) {
    this.instrumenter = instrumenter;
    this.collector = new Collector();
    this.instrument = instrumenter.instrument.bind(this.instrumenter);

    var origInstrumentSync = instrumenter.instrumentSync;
    this.instrumentSync = function () {
        var args = Array.prototype.slice.call(arguments),
            ret = origInstrumentSync.apply(this.instrumenter, args),
            baseline = this.instrumenter.lastFileCoverage(),
            coverage = {};
        coverage[baseline.path] = baseline;
        this.collector.add(coverage);
        return ret;
    };
    //monkey patch the instrumenter to call our version instead
    instrumenter.instrumentSync = this.instrumentSync.bind(this);
}

BaselineCollector.prototype = {
    getCoverage: function () {
        return this.collector.getFinalCoverage();
    }
};


function processFiles(instrumenter, inputDir, outputDir, relativeNames) {
    var processor = function (name, callback) {
            var inputFile = path.resolve(inputDir, name),
                outputFile = path.resolve(outputDir, name),
                inputFileExtenstion = path.extname(inputFile),
                isJavaScriptFile = (inputFileExtenstion === '.js'),
                oDir = path.dirname(outputFile),
                readStream, writeStream;

            callback = flowControl.callOnce(callback);
            mkdirp.sync(oDir);

            if (fs.statSync(inputFile).isDirectory()) {
                return callback(null, name);
            }

            if (isJavaScriptFile) {
                fs.readFile(inputFile, 'utf8', function (err, data) {
                    if (err) { return callback(err, name); }
                    instrumenter.instrument(data, inputFile, function (iErr, instrumented) {
                        if (iErr) { return callback(iErr, name); }
                        fs.writeFile(outputFile, instrumented, 'utf8', function (err) {
                            return callback(err, name);
                        });
                    });
                });
            }
            else {
                // non JavaScript file, copy it as is
                readStream = fs.createReadStream(inputFile, {'bufferSize': READ_FILE_CHUNK_SIZE});
                writeStream = fs.createWriteStream(outputFile);

                readStream.on('error', callback);
                writeStream.on('error', callback);

                readStream.pipe(writeStream);
                readStream.on('end', function() {
                    callback(null, name);
                });
            }
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
                formatOption('--[no-]compact', 'produce [non]compact output, defaults to compact'),
                formatOption('--[no-]complete-copy', 'also copy non-javascript files to the ouput directory as is, defaults to false'),
                formatOption('--save-baseline', 'produce a baseline coverage.json file out of all files instrumented'),
                formatOption('--baseline-file <file>', 'filename of baseline file, defaults to coverage/coverage-baseline.json')
            ].join('\n\n') + '\n');
        console.error('\n');
    },

    run: function (args, callback) {

        var config = {
                output: path,
                x: [Array, String],
                variable: String,
                compact: Boolean,
                'complete-copy': Boolean,
                verbose: Boolean,
                'save-baseline': Boolean,
                'baseline-file': path,
                'embed-source': Boolean
            },
            opts = nopt(config, { v : '--verbose' }, args, 0),
            cmdArgs = opts.argv.remain,
            file,
            stats,
            stream,
            includes,
            instrumenter = new Instrumenter({ coverageVariable: opts.variable }),
            needBaseline = opts['save-baseline'],
            baselineFile = opts['baseline-file'] || path.resolve(process.cwd(), 'coverage', 'coverage-baseline.json');

        verbose = opts.verbose;
        if (cmdArgs.length !== 1) {
            return callback(inputError.create('Need exactly one filename/ dirname argument for the instrument command!'));
        }
        if (typeof opts.compact === 'undefined') {
            opts.compact = true;
        }
        if (typeof opts['complete-copy'] === 'undefined') {
            // false for backward compatibility
            opts['complete-copy'] = false;
        }

        if (opts['complete-copy']) {
            includes = ['**/*'];
        }
        else {
            includes = ['**/*.js'];
        }

        instrumenter = new Instrumenter({
            coverageVariable: opts.variable,
            embedSource: opts['embed-source'],
            noCompact: !opts.compact
        });

        if (needBaseline) {
            mkdirp.sync(path.dirname(baselineFile));
            instrumenter = new BaselineCollector(instrumenter);
            process.on('exit', function () {
                util.puts('Saving baseline coverage at: ' + baselineFile);
                fs.writeFileSync(baselineFile, JSON.stringify(instrumenter.getCoverage()), 'utf8');
            });
        }

        file = path.resolve(cmdArgs[0]);
        stats = fs.statSync(file);
        if (stats.isDirectory()) {
            if (!opts.output) { return callback(inputError.create('Need an output directory [-o <dir>] when input is a directory!')); }
            if (opts.output === file) { return callback(inputError.create('Cannot instrument into the same directory/ file as input!')); }
            mkdirp.sync(opts.output);
            filesFor({
                root: file,
                includes: includes,
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
            if (stream !== process.stdout) {
                stream.end();
            }
        }
    }
});

module.exports = InstrumentCommand;

