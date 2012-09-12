/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    exists = fs.existsSync || path.existsSync,
    mkdirp = require('mkdirp'),
    FileWriter = require('../../lib/util/file-writer'),
    outputDir = path.resolve(__dirname, 'output'),
    FOO = path.resolve(outputDir, 'foo-written.js'),
    BAR = path.resolve(outputDir, 'bar-written.js'),
    writer,
    LINES = [ 'This is line 1', 'This is line 2', 'This is line 3' ];

function testContents(test) {
    test.equal(LINES.join('\n') + '\n', fs.readFileSync(FOO, 'utf8'));
    test.done();
}

function battery(sync) {
    return {
        setUp: function (cb) {
            mkdirp.sync(outputDir);
            writer = new FileWriter(sync);
            cb();
        },
        tearDown: function (cb) {
            writer = null;
            if (exists(FOO)) { fs.unlinkSync(FOO); }
            if (exists(BAR)) { fs.unlinkSync(BAR); }
            cb();
        },
        "should write file with a series of calls": function (test) {
            writer.start(FOO);
            LINES.forEach(function (line) { writer.write(line); writer.write('\n'); });
            writer.end(FOO);
            if (sync) {
                testContents(test);
            } else {
                setTimeout(testContents.bind(null, test), 500);
            }
        },
        "should write file in callback mode": function (test) {
            writer.writeFile(FOO, function (w) {
                LINES.forEach(function (line) { w.println(line); });
            });
            if (sync) {
                testContents(test);
            } else {
                setTimeout(testContents.bind(null, test), 500);
            }
        },
        "should not allow end before start": function (test) {
            test.throws(function () {
                writer.end();
            }, /Attempt to end a file without starting it/);
            test.done();
        },
        "should not allow start when started": function (test) {
            writer.start(BAR);
            test.throws(function () {
                writer.start(FOO);
            }, /Attempt to start a new file before ending the previous one/);
            test.done();
        }
    };
}

module.exports = {
    "when in sync mode": battery(true),
    "when in async mode": battery(false)
};