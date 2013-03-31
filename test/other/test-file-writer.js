/*jslint nomen: true */

var path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    FileWriter = require('../../lib/util/file-writer'),
    outputDir = path.resolve(__dirname, 'output'),
    FOO = path.resolve(outputDir, 'foo-written.js'),
    writer,
    MAX_FILES = 1000,
    LINES = [ 'This is line 1', 'This is line 2', 'This is line 3' ];

function testContents(test) {
    test.equal(LINES.join('\n') + '\n', fs.readFileSync(FOO, 'utf8'));
    test.done();
}

function fileNames() {
    var i,
        ret = [];
    for (i = 0; i < MAX_FILES; i += 1) {
        ret.push(path.resolve(outputDir, 'file' + i + '.txt'));
    }
    return ret;
}

function testAllFiles(test) {
    var files = fileNames();
    files.forEach(function (file) {
        test.equal(file + '\n', fs.readFileSync(file, 'utf8'));
    });
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
            rimraf.sync(outputDir);
            cb();
        },
        "should write file in callback mode": function (test) {
            writer.on('done', testContents.bind(null, test));
            writer.writeFile(FOO, function (w) {
                LINES.forEach(function (line) { w.println(line); });
            });
            writer.done();
        },
        "should write 1000 files": function (test) {
            var files = fileNames();
            writer.on('done', testAllFiles.bind(null, test));
            files.forEach(function (file) {
                writer.writeFile(file, function (w) {
                    w.println(file);
                });
            });
            writer.done();
        }
    };
}

module.exports = {
    "when in sync mode": battery(true),
    "when in async mode": battery(false)
};
