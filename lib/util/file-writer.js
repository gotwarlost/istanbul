/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var fs = require('fs');

function FileWriter(sync) {
    this.writing = false;
    this.start = sync ? this.startSync : this.startAsync;
    this.write = sync ? this.writeSync : this.writeAsync;
    this.end = sync ? this.endSync : this.endAsync;
}

FileWriter.prototype = {
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
        this.doStart();
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
        this.doStart();
        this.stream = fs.createWriteStream(fileName);
    },
    writeAsync: function (str) {
        this.stream.write(str);
    },
    endAsync: function () {
        this.doEnd();
        this.stream.end();
    },
    doStart: function () {
        if (this.writing) { throw new Error('Attempt to start a new file before ending the previous one'); }
        this.writing = true;
    },
    doEnd : function () {
        if (!this.writing) { throw new Error('Attempt to end a file without starting it'); }
        this.writing = false;
    }
};

module.exports = FileWriter;