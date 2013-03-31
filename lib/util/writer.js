/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

function extend(cons, proto) {
    Object.keys(proto).forEach(function (k) {
        cons.prototype[k] = proto[k];
    });
}

//abstract interface for writing content
function ContentWriter() {
}

ContentWriter.prototype = {
    write: function (/* str */) { throw new Error('write: must be overridden'); },
    println: function (str) { this.write(str); this.write('\n'); }
};

//abstract interface for writing files and assets
function Writer() {
    EventEmitter.call(this);
}

util.inherits(Writer, EventEmitter);

extend(Writer, {
    /**
     * allows writing content to a file using a callback that is passed a content writer
     * @param file the name of the file to write
     * @param callback the callback that is called as `callback(contentWriter)`
     */
    writeFile: function (/* file, callback */) { throw new Error('writeFile: must be overridden'); },
    /**
     * copies a file from source to destination
     * @param source the file to copy, found on the file system
     * @param dest the destination path
     */
    copyFile: function (/* source, dest */) { throw new Error('copyFile: must be overridden'); },
    /**
     * marker method to indicate that the caller is done with this writer object
     * The writer is expected to emit a `done` event only after this method is called
     * and it is truly done.
     */
    done: function () { throw new Error('done: must be overridden'); }
});

module.exports = {
    Writer: Writer,
    ContentWriter: ContentWriter
};

