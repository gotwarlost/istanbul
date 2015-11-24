/*
Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
*/

/*jslint nomen: true */
var meta = require('./lib/util/meta');

//register our standard plugins
require('./lib/register-plugins');

/**
 * the top-level API for `istanbul`. provides access to the key libraries in
 * istanbul so you can write your own tools using `istanbul` as a library.
 *
 * Usage
 * -----
 *
 *      var istanbul = require('istanbul');
 *
 *
 * @class Istanbul
 * @static
 * @module main
 * @main main
 */

module.exports = {
    /**
     * the version of the library
     * @property VERSION
     * @type String
     * @static
     */
    VERSION: meta.VERSION
};


