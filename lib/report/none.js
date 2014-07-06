/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var util = require('util'),
    Report = require('./index');

function NoneReport() {
    Report.call(this);
}

NoneReport.TYPE = 'none';
util.inherits(NoneReport, Report);

Report.mix(NoneReport, {
    synopsis: function () {
        return 'Does nothing. Useful to override default behavior and suppress reporting entirely';
    },
    writeReport: function (/* collector, sync */) {
        //noop
    }
});

module.exports = NoneReport;
