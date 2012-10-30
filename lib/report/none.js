/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var Report = require('./index');

function NoneReport() {
    Report.call(this);
}

NoneReport.TYPE = 'none';

Report.mix(NoneReport, {
    writeReport: function (/* collector, sync */) {
        //noop
    }
});

module.exports = NoneReport;
