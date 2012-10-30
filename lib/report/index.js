/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var Factory = require('../util/factory'),
    factory = new Factory('report', __dirname, false);
/**
 * abstract report class for producing coverage reports.
 *
 * Usage
 * -----
 *
 *      var Report = require('istanbul').Report,
 *          report = Report.create('html'),
 *          collector = new require('istanbul').Collector;
 *
 *      collector.add(coverageObject);
 *      report.writeReport(collector);
 *
 * @class Report
 * @constructor
 * @protected
 * @param {Object} options Optional. The options supported by a specific store implementation.
 */
function Report(/* options */) {}
//add register, create, mix, loadAll, getStoreList as class methods
factory.bindClassMethods(Report);

/**
 * registers a new report implementation.
 * @method register
 * @static
 * @param {Function} constructor the constructor function for the report. This function must have a
 *  `TYPE` property of type String, that will be used in `Report.create()`
 */
/**
 * returns a report implementation of the specified type.
 * @method create
 * @static
 * @param {String} type the type of report to create
 * @param {Object} opts Optional. Options specific to the report implementation
 * @return {Report} a new store of the specified type
 */

Report.prototype = {
    /**
     * writes the report for a set of coverage objects added to a collector.
     * @method writeReport
     * @param {Collector} collector the collector for getting the set of files and coverage
     * @param {Boolean} sync true if reports must be written synchronously, false if they can be written using asynchronous means (e.g. stream.write)
     */
    writeReport: function (/* collector, sync */) {
        throw new Error('writeReport: must be overridden');
    }
};

module.exports = Report;


