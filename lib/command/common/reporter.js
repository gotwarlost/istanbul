var Report = require('../../report');

function Reporter(opts) {
    opts = opts || {};

    this.verbose = opts.verbose;
    this.reports = {};
}

Reporter.prototype = {
    add: function (name, opts) {
        if (this.reports[name]) {
            return;
        }
        this.reports[name] = Report.create(name, opts);
    },

    write: function (collector, sync) {
        var reports = this.reports,
            verbose = this.verbose;

        Object.keys(reports).forEach(function (name) {
            var report = reports[name];
            if (verbose) {
                console.error('Write report: ' + name);
            }
            report.writeReport(collector, sync);
        });
    }
};

module.exports = Reporter;
