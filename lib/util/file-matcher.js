/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var fileset = require('fileset'),
    path = require('path'),
    seq = 0;

function filesFor(options, callback) {
    if (!callback && typeof options === 'function') {
        callback = options;
        options = null;
    }
    options = options || {};

    var root = options.root,
        includes = options.includes,
        excludes = options.excludes,
        relative = options.relative,
        opts;

    root = root || process.cwd();
    includes = includes && Array.isArray(includes) ? includes : [ '**/*.js' ];
    excludes = excludes && Array.isArray(excludes) ? excludes : [ '**/node_modules/**' ];

    opts = { cwd: root };
    seq += 1;
    opts['x' + seq + new Date().getTime()] = true; //cache buster for minimatch cache bug
    fileset(includes.join(' '), excludes.join(' '), opts, function (err, files) {
        if (err) { return callback(err); }
        if (!relative) {
            files = files.map(function (file) { return path.resolve(root, file); });
        }
        callback(err, files);
    });
}

function matcherFor(options, callback) {

    if (!callback && typeof options === 'function') {
        callback = options;
        options = null;
    }
    options = options || {};
    options.relative = false; //force absolute paths

    filesFor(options, function (err, files) {
        var fileMap = {},
            matchFn;
        if (err) { return callback(err); }
        files.forEach(function (file) { fileMap[file] = true; });

        matchFn = function (file) { return fileMap[file]; };
        matchFn.files = Object.keys(fileMap);
        return callback(null, matchFn);
    });
}

module.exports = {
    filesFor: filesFor,
    matcherFor: matcherFor
};

