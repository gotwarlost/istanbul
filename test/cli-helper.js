/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    cp = require('child_process'),
    Module = require('module'),
    originalLoader = Module._extensions['.js'],
    common = require('./common'),
    MAIN_FILE = path.resolve(__dirname, '..', 'lib', 'cli.js'),
    DEFAULT_CWD = path.resolve(__dirname, 'cli', 'sample-project'),
    COVER_ROOT = path.resolve(__dirname, '..'),
    EXCLUDES = [ '**/node_modules/**', '**/test/**', '**/yui-load-hook.js'],
    COVER_VAR = '$$selfcover$$',
    seq = 0,
    verbose = false,
    OPTS = {
    };

/*
 * Danger, Will Robinson! A lot of small stuff has to fall in place just so
 * for self-coverage to work correctly for command line tests.
 *
 * In no-self-cover mode, this class does very little - which is:
 *
 *  1. Create a child process to run the supplied istanbul command
 *  2. Callback the test case with an object that allows the test case
 *      to grep on stdout and stderr, inspect exit codes etc.
 *  3. This is a "correct" test because we run the commands exactly as they
 *      would be run by the user.
 *
 * In self-cover mode, this works slightly differently:
 *
 *  1. Sets up a bunch of environment variables to keep track of what it was
 *      asked to do
 *  2. Creates a child process forking _itself_. Returns the same object to
 *      the caller for purposes of grepping stdout, inspecting status codes etc.
 *  3. In the child process,
 *      a. hooks the module loader to set up coverage for our library code
 *      b. Ensures that the `hook` module is not loaded until all this happens
 *         so that the hook module sees _our_ module loader hook as the original
 *         loader. This ensures that our hook will be used to instrument this
 *         library's code. Note that the hook set up by the `cover` command that
 *         is executed only instruments the modules of the sample test library.
 *      c. Calls Module.runMain on the command that it was asked to invoke
 *      d. Sets up an exit handler to write the coverage information for our
 *         library calls
 *   4. The exit handler is also set up in special ways because in order to
 *      instrument the `cover` command's exit handler, our exit handler has
 *      to be added later so as to be able to track coverage for the cover
 *      commands handler.
 *
 *      Since there is no general purpose way in which this can be correctly
 *      done, test cases have to indicate which ones expect the exit handler
 *      to be set up in the cover module and which ones do not. This is the
 *      reason `setOpts` exists.
 *
 */

function setVerbose(flag) {
    verbose = flag;
}
function setOpts(userOpts) {
    Object.keys(userOpts).forEach(function (k) { OPTS[k] = userOpts[k]; });
}

function resetOpts() {
    OPTS = {};
}

function runCommand(command, args, envVars, callback) {
    var cmd = 'node',
        selfCover = common.isSelfCover(),
        env = {},
        handle,
        out = '',
        err = '',
        exitCode = 1,
        grepper = function (array) {
            return function (pat) {
                var filtered = array.filter(function (item) {
                    return item.match(pat);
                });
                if (filtered.length === 0) {
                    if (verbose) {
                        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                        console.log('Could not find: ' + pat + ' in:');
                        console.log(array.join('\n'));
                        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    }
                }
                return filtered.length > 0;
            };
        };

    if (selfCover) {
        seq += 1;
        env.COMMAND_NAME = command || '';
        env.COMMAND_ARGS = args.join('\t');
        env.COVERAGE_FILE = 'coverage-' + seq + '.json';
        env.LAZY_HOOK = OPTS.lazyHook ? '1' : '';
        args = [ __filename ];
    } else {
        if (command) {
            args.unshift(command);
        }
        args.unshift(MAIN_FILE);
    }

    if (!callback && typeof envVars === 'function') {
        callback = envVars;
        envVars = {};
    }

    Object.keys(process.env).forEach(function (key) {
        env[key] = process.env[key];
    });

    Object.keys(envVars).forEach(function (key) {
        env[key] = envVars[key];
    });

    handle = cp.spawn(cmd, args, { env: env, cwd: OPTS.cwd || DEFAULT_CWD });
    handle.stdout.setEncoding('utf8');
    handle.stderr.setEncoding('utf8');
    handle.stdout.on('data', function (data) {
        out += data;
        if (verbose) {
            process.stdout.write(data);
        }
    });
    handle.stderr.on('data', function (data) {
        err += data;
        if (verbose) {
            process.stderr.write(data);
        }
    });
    handle.on('close', function (code) {
        exitCode = code;
        out = out.split(/\r?\n/);
        err = err.split(/\r?\n/);
        callback({
            succeeded: function () { return exitCode === 0; },
            exitCode: exitCode,
            stdout: function () { return out; },
            stderr: function () { return err; },
            grepOutput: grepper(out),
            grepError: grepper(err)
        });
    });
}

function customHook(lazyHook, callback) {
    var Instrumenter = require('../lib/instrumenter'),
        instrumenter = new Instrumenter({ coverageVariable: COVER_VAR }),
        transformer = function (file) {
            return instrumenter.instrumentSync(fs.readFileSync(file, 'utf8'), file);
        },
        handler = function () {
            process.once('exit', function () {
                var file;
                if (typeof global[COVER_VAR] !== 'undefined') {
                    file = path.resolve(common.getCoverageDir(), process.env.COVERAGE_FILE);
                    fs.writeFileSync(file, JSON.stringify(global[COVER_VAR], undefined, 4), 'utf8');
                }
            });
        };

    require('../lib/util/file-matcher').matcherFor({ root : COVER_ROOT, excludes: EXCLUDES, includes: [ '**/*.js'] }, function (err, matcher) {
        var added = false;

        Module._extensions['.js'] = function (module, filename) {
            if (matcher(filename)) {
                module._compile(transformer(filename), filename);
            } else {
                originalLoader(module, filename);
            }
        };

        if (!lazyHook) {
            handler();
        } else {
            process.on('newListener', function (event) {
                if (event === 'exit') {
                    if (!added) {
                        added = true;
                        process.nextTick(function () {
                            handler();
                        });
                    }
                }
            });
        }
        callback();
    });
}

module.exports = {
    setVerbose: setVerbose,
    runCommand: runCommand,
    resetOpts: resetOpts,
    setOpts: setOpts
};

if (require.main === module) { //we are running ourselves under self-cover
    (function () {
        var command = process.env.COMMAND_NAME,
            args = process.env.COMMAND_ARGS ? process.env.COMMAND_ARGS.split(/\t/) : [],
            fullArgs = [];

        if (command) { fullArgs.push(command); }
        fullArgs.push.apply(fullArgs, args);
        customHook(process.env.LAZY_HOOK, function () {
            console.error('Running command using CLI object:' + JSON.stringify({ cmd: command, args: args }));
            require('../lib/cli').runToCompletion(fullArgs);
        });
    }());
}

