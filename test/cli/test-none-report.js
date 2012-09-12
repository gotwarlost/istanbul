/*jslint nomen: true */
var Reporter = require('../../lib/report/none'),
    Report = require('../../lib/report');

module.exports = {
    "should be a noop without any failures": function (test) {
        var reporter = new Reporter();
        test.doesNotThrow(function () { reporter.writeReport(); });
        test.done();
    },
    "should throw when Base report class writeMethod called": function (test) {
        var r = new Report();
        test.throws(function () { r.writeReport(); }, /must be overridden/);
        test.done();
    }
};

