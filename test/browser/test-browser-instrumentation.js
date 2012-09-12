/*jslint nomen: true */
var which = require('which'),
    phantom,
    path = require('path'),
    fs = require('fs'),
    child_process = require('child_process'),
    filesFor = require('../../lib/util/file-matcher').filesFor,
    Instrumenter = require('../../lib/instrumenter'),
    instrumenter = new Instrumenter({ backdoor: { omitTrackerSuffix: true } }),
    ROOT = path.resolve(__dirname, '..', '..', 'lib'),
    common = require('../common'),
    filesToInstrument,
    server,
    exited,
    cp;

function runPhantom(cmd, script, port, files) {
    var args = [ script ];
    args.push(port);
    args.push.apply(args, files);
    console.log('Start phantom');
    cp = child_process.spawn(cmd, args);
    cp.stdout.on('data', function (data) { process.stdout.write(data); });
    cp.stderr.on('data', function (data) { process.stderr.write(data); });
    cp.on('exit', function () {
        exited = 1;
    });
}

module.exports = {
    setUp: function (cb) {
        try {
            phantom = which.sync('phantomjs');
        } catch (ex) {}
        filesFor({
            root: ROOT,
            includes: [ '**/*.js' ],
            xexcludes: [ '**/instrumenter.js' ],
            relative: true
        }, function (err, files) {
            filesToInstrument = files;
            cb();
        });
    },
    "should produce identical instrumentation results when instrumentation run on browser v/s nodejs": function (test) {
        if (!phantom) {
            console.error('******************************************************************');
            console.error('No phantomjs found on path, skipping browser instrumentation test');
            console.error('******************************************************************');
            test.done();
            return;
        }
        var finalFn = function () {
            if (server) { server.close(); }
            if (!cp.exited) { cp.kill(); }
        },
            server,
            port = 9000;
        try {
            console.log('Start server');
            server = require('./support/server').create(port, process.env.SELF_COVER ? instrumenter : null, ROOT);
            server.on('instrumented', function (file, instrumented) {
                var code = fs.readFileSync(path.resolve(ROOT, file), 'utf8'),
                    serverSideInstrumented = instrumenter.instrumentSync(code, file);
                test.equal(serverSideInstrumented, instrumented, 'No match for [' + file + ']');
            });
            server.on('done', function (coverage) {
                if (common.isSelfCover()) {
                    try {
                        if (coverage) {
                            fs.writeFileSync(path.resolve(common.getCoverageDir(), 'coverage-browser.json'), JSON.stringify(coverage), 'utf8');
                        } else {
                            console.log('No coverage found');
                        }
                    } catch (err) {
                        console.error(err.message || err);
                        console.error(err.stack);
                        test.ok(false, err.message || err);
                    }
                }
                finalFn();
                test.done();
            });
            runPhantom(phantom, path.resolve(__dirname, 'support', 'phantom-test.client.js'), port, filesToInstrument);
        } catch (ex) {
            console.error(ex.message || ex);
            console.error(ex.stack);
            test.ok(false, ex.message || ex);
            test.done();
        }

    }
};

