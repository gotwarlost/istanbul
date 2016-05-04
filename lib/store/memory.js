/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var util = require('util'),
    Store = require('./index'),
    deepClone = require('../object-utils').deepClone;

/**
 * a `Store` implementation using an in-memory object.
 *
 * Usage
 * -----
 *
 *      var store = require('istanbul').Store.create('memory');
 *
 *
 * @class MemoryStore
 * @extends Store
 * @module store
 * @constructor
 */
function MemoryStore() {
    Store.call(this);
    this.map = Object.create(null);

    // Use 2nd map for objects that were inserted using setObject
    // to avoid JSON round-trips.
    this.objectMap = Object.create(null);
}

MemoryStore.TYPE = 'memory';
util.inherits(MemoryStore, Store);

Store.mix(MemoryStore, {
    set: function (key, contents) {
        this.map[key] = contents;
        delete this.objectMap[key];
    },

    get: function (key) {
        if (!this.hasKey(key)) {
            throw new Error('Unable to find entry for [' + key + ']');
        }

        if (Object.prototype.hasOwnProperty.call(this.map, key)) {
            return this.map[key];
        }

        this.map[key] = JSON.stringify(this.objectMap[key]);
        return this.map[key];
    },

    getObject: function (key) {
        if (Object.prototype.hasOwnProperty.call(this.objectMap, key)) {
            return this.objectMap[key];
        }

        this.objectMap[key] = JSON.parse(this.get(key));
        return this.objectMap[key];
    },

    setObject: function (key, object) {
        this.objectMap[key] = deepClone(object);
        delete this.map[key];
    },

    hasKey: function (key) {
        return Object.prototype.hasOwnProperty.call(this.map, key) ||
               Object.prototype.hasOwnProperty.call(this.objectMap, key);
    },

    keys: function () {
        var rawKeys = Object.keys(this.map);
        var objKeys = Object.keys(this.objectMap);
        return rawKeys.concat(objKeys.filter(function(k) {
            return rawKeys.indexOf(k) === -1;
        }));
    },

    dispose: function () {
        this.map = Object.create(null);
        this.objectMap = Object.create(null);
    }
});

module.exports = MemoryStore;
