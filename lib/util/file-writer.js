/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    util = require('util'),
    fs = require('fs'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    writer = require('./writer'),
    Writer = writer.Writer,
    ContentWriter = writer.ContentWriter;

function extend(cons, proto) {
    Object.keys(proto).forEach(function (k) {
        cons.prototype[k] = proto[k];
    });
}

function BufferedContentWriter() {
    ContentWriter.call(this);
    this.content = '';
}
util.inherits(BufferedContentWriter, ContentWriter);

extend(BufferedContentWriter, {
    write: function (str) {
        this.content += str;
    },
    getContent: function () {
        return this.content;
    }
});

function StreamContentWriter(stream) {
    ContentWriter.call(this);
    this.stream = stream;
}
util.inherits(StreamContentWriter, ContentWriter);

extend(StreamContentWriter, {
    write: function (str) {
        this.stream.write(str);
    }
});

function SyncFileWriter() {
    Writer.call(this);
}
util.inherits(SyncFileWriter, Writer);

extend(SyncFileWriter, {
    writeFile: function (file, callback) {
        mkdirp.sync(path.dirname(file));
        var cw = new BufferedContentWriter();
        callback(cw);
        fs.writeFileSync(file, cw.getContent(), 'utf8');
    },
    done: function () {
        this.emit('done'); //everything already done
    }
});

function AsyncFileWriter() {
    this.queue = async.queue(this.processFile.bind(this), 20);
    this.openFileMap = {};
}

util.inherits(AsyncFileWriter, Writer);

extend(AsyncFileWriter, {
    writeFile: function (file, callback) {
        this.openFileMap[file] = true;
        this.queue.push({ file: file, callback: callback });
    },
    processFile: function (task, cb) {
        var file = task.file,
            userCallback = task.callback,
            that = this,
            stream,
            contentWriter;

        mkdirp.sync(path.dirname(file));
        stream = fs.createWriteStream(file);
        stream.on('close', function () {
            delete that.openFileMap[file];
            cb();
            that.checkDone();
        });
        stream.on('error', function (err) { that.emit('error', err); });
        contentWriter = new StreamContentWriter(stream);
        userCallback(contentWriter);
        stream.end();
    },
    done: function () {
        this.doneCalled = true;
        this.checkDone();
    },
    checkDone: function () {
        if (!this.doneCalled) { return; }
        if (Object.keys(this.openFileMap).length === 0) {
            this.emit('done');
        }
    }
});

function FileWriter(sync) {
    Writer.call(this);
    var that = this;
    this.delegate = sync ? new SyncFileWriter() : new AsyncFileWriter();
    this.delegate.on('error', function (err) { that.emit('error', err); });
    this.delegate.on('done', function () { that.emit('done'); });
}

util.inherits(FileWriter, Writer);

extend(FileWriter, {
    copyFile: function (source, dest) {
        mkdirp.sync(path.dirname(dest));
        fs.writeFileSync(dest, fs.readFileSync(source));
    },
    writeFile: function (file, callback) {
        this.delegate.writeFile(file, callback);
    },
    done: function () {
        this.delegate.done();
    }
});

module.exports = FileWriter;