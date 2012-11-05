/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp');

function FileWriter(sync) {
    this.writing = false;
    this.start = sync ? this.startSync : this.startAsync;
    this.write = sync ? this.writeSync : this.writeAsync;
    this.end = sync ? this.endSync : this.endAsync;
}

FileWriter.prototype = {
    copyFile: function (source, dest) {
        mkdirp.sync(path.dirname(dest));
        fs.writeFileSync(dest, fs.readFileSync(source));
    },
    writeFile: function (file, callback) {
        this.start(file);
        callback(this);
        this.end();
    },
    println: function (str) {
        this.write(str);
        this.write('\n');
    },
    startSync: function (fileName) {
        this.doStart(fileName);
        this.contents = '';
        this.filename = fileName;
    },
    writeSync: function (str) {
        this.contents += str;
    },
    endSync: function () {
        this.doEnd();
        fs.writeFileSync(this.filename, this.contents, 'utf8');
    },
    startAsync: function (fileName) {
        this.doStart(fileName);
        this.stream = fs.createWriteStream(fileName);
    },
    writeAsync: function (str) {
        this.stream.write(str);
    },
    endAsync: function () {
        this.doEnd();
        this.stream.end();
    },
    doStart: function (fileName) {
        if (this.writing) { throw new Error('Attempt to start a new file before ending the previous one'); }
        this.writing = true;
        mkdirp.sync(path.dirname(fileName));
    },
    doEnd : function () {
        if (!this.writing) { throw new Error('Attempt to end a file without starting it'); }
        this.writing = false;
    }
};

module.exports = FileWriter;