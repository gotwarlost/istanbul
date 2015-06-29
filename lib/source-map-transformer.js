/*
 Copyright (c) 2015, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
"use strict";
var path = require('path'),
    MemoryStore = require('./store/memory');

function emptyCoverage(file) {
    return {
        path: file,
        statementMap: {},
        fnMap: {},
        branchMap: {},
        s: {},
        b: {},
        f: {},
        _meta: {
            last: {
                s: 0,
                f: 0,
                b: 0
            },
            seen: {}
        }
    };
}

function addStatement(data, st, hits) {
    var key = [
        's',
        st.start.line,
        st.start.column,
        st.end.line,
        st.end.column
    ].join(':'),
    index = data._meta.seen[key];

    if (!index) {
        data._meta.seen[key] = index;
        data._meta.last.s += 1;
        index = data._meta.last.s;
        data.statementMap[index] = st;
    }
    data.s[index] = data.s[index] || 0;
    data.s[index] += hits;
}

function addFunction(data, fn, hits) {
    var key = [
            'f',
            fn.loc.start.line,
            fn.loc.start.column,
            fn.loc.end.line,
            fn.loc.end.column
        ].join(':'),
        index = data._meta.seen[key];

    if (!index) {
        data._meta.seen[key] = index;
        data._meta.last.f += 1;
        index = data._meta.last.f;
        data.fnMap[index] = fn;
    }
    data.f[index] = data.f[index] || 0;
    data.f[index] += hits;
}

function addBranch(data, branch, hits) {
    var key = [ 'b'],
        index,
        i;

    branch.locations.forEach(function (l) {
        key.push(l.start.line, l.start.column, l.end.line, l.end.column);
    });

    key = key.join(':');
    index = data._meta.seen[key];
    if (!index) {
        data._meta.seen[key] = index;
        data._meta.last.b += 1;
        index = data._meta.last.b;
        data.branchMap[index] = branch;
    }

    if (!data.b[index]) {
        data.b[index] = [];
        branch.locations.forEach(function () {
            data.b[index].push(0);
        });
    }
    for (i = 0; i < hits.length; i += 1) {
        data.b[index][i] += hits[i];
    }
}

/**
 * A mechanism to convert coverage using source map information. To be typically
 * used in the context of a `Collector`.
 *
 * @class SourceMapTransformer
 * @param {Function} finder - a function that returns a source map object (or a falsy value) given a filename
 * @param {Object} opts optional
 * @param {Object} opts.store - a store to use for keeping track of coverage objects
 * @constructor
 */
function SourceMapTransformer(finder, opts) {
    this.finder = finder;
    opts = opts || {};
    this.store = opts.store || new MemoryStore();
    this.seen = {};
    this.lastFile = null;
    this.lastData = null;
    this.doneCalled = false;
}

SourceMapTransformer.prototype = {
    clone: function (obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    unloadCache: function () {
        if (this.lastFile) {
            this.store.setObject(this.lastFile, this.lastData);
        }
        this.lastFile = null;
        this.lastData = null;
    },
    getSourceCoverage: function (filename) {
        filename = path.resolve(filename);
        if (this.lastFile === filename) {
            return this.lastData;
        }
        this.unloadCache();
        this.lastFile = filename;
        var data;
        if (this.store.hasKey(filename)) {
            data = this.store.getObject(filename);
        } else {
            data = emptyCoverage(filename);
        }
        this.lastData = data;
        return data;
    },
    getMapping: function (map, obj) {
        var start = map.originalPositionFor(obj.start),
            end = map.originalPositionFor(obj.end),
            src;

        if (!(start && end)) {
            return null;
        }
        if (!(start.source && end.source && start.source === end.source)) {
            return null;
        }
        if (start.line === null || start.column === null) {
            return null;
        }
        if (end.line === null || end.column === null) {
            return null;
        }
        src = start.source;
        delete start.source;
        delete end.source;

        if (obj.start.column !== 0 && start.column === 0) {
            start.column = obj.start.column;
        }

        if (obj.end.column !== 0 && end.column === 0) {
            end.column = obj.end.column;
        }

        return {
            source: src,
            loc: { start: start, end: end }
        };
    },
    processStatement: function (map, obj, hits) {
        var mapping = this.getMapping(map, obj),
            data;
        if (mapping === null) {
            return 0;
        }
        data = this.getSourceCoverage(mapping.source);
        addStatement(data, mapping.loc, hits);
        return 1;
    },
    processFunction: function (map, obj, hits) {
        var mapping = this.getMapping(map, obj.loc),
            data;
        if (mapping === null) {
            return 0;
        }
        data = this.getSourceCoverage(mapping.source);
        obj = this.clone(obj);
        obj.loc = mapping.loc;
        addFunction(data, obj, hits);
        return 1;
    },
    processBranch: function (map, obj, hits) {
        var data,
            locations = [],
            source,
            mapLoc,
            i;

        for (i = 0; i < obj.locations.length; i += 1) {
            mapLoc = this.getMapping(map, obj.locations[i]);
            if (mapLoc === null) {
                return 0;
            }
            if (i === 0) {
                source = mapLoc.source;
                locations.push(mapLoc.loc);
            } else if (source !== mapLoc.source) {
                return 0;
            } else {
                locations.push(mapLoc.loc);
            }
        }

        data = this.getSourceCoverage(source);
        obj = this.clone(obj);
        obj.locations = locations;
        addBranch(data, obj, hits);
        return 1;
    },
    /**
     * adds coverage information for a single file. This method may only be called
     * once for every unique file name.
     *
     * @method addFileCoverage
     * @param {String} file the file for which to add coverage
     * @param {Object} coverage the file coverage object
     */
    addFileCoverage: function (file, coverage) {
        if (this.seen[file]) {
            throw new Error('Attempt to add the same file multiple times: ' +
                file + "; use a collector instead");
        }
        this.seen[file] = true;

        var map = this.finder(file),
            that = this,
            changes = 0;

        if (!(map && typeof map.originalPositionFor === 'function')) {
            this.store.setObject(file, coverage);
            return;
        }
        Object.keys(coverage.statementMap).forEach(function (index) {
            changes += that.processStatement(map, coverage.statementMap[index], coverage.s[index]);
        });
        Object.keys(coverage.fnMap).forEach(function (index) {
            changes += that.processFunction(map, coverage.fnMap[index], coverage.f[index]);
        });
        Object.keys(coverage.branchMap).forEach(function (index) {
            changes += that.processBranch(map, coverage.branchMap[index], coverage.b[index]);
        });
        if (changes === 0) {
            console.error('Nothing mapped from file: ' + file);
        }
    },
    /**
     * indicates that all files have been added to this object. This method
     * *must* be called to ensure that the store object is correctly populated.
     *
     * @method done
     * @return the store object correctly populated with coverage info.
     */
    done: function () {
        var that = this;
        this.doneCalled = true;
        this.unloadCache();
        this.store.keys().forEach(function (k) {
            var data = that.store.getObject(k);
            if (data.hasOwnProperty('_meta')) {
                delete data._meta;
                that.store.setObject(k, data);
            }
        });
        return this.store;
    }
};

module.exports = {
    create: function (finder, opts) {
        return new SourceMapTransformer(finder, opts);
    }
};
