var Report = require('../../report'),
    inputError = require('../../util/input-error');

function Reporter(config) {
    this.config = config;
    this.reports = {};
}

Reporter.prototype = {
    add: function (name) {
        if (this.reports[name]) { // already added
            return;
        }
        var config = this.config,
            rptConfig = config.reporting.reportConfig()[name] || {};
        rptConfig.verbose = config.verbose;
        rptConfig.dir = config.reporting.dir();
        rptConfig.watermarks = config.reporting.watermarks();
        try {
            this.reports[name] = Report.create(name, rptConfig);
        } catch (ex) {
            throw inputError.create('Invalid report format [' + name + ']');
        }
    },

    addAll: function (fmts) {
        var that = this;
        fmts.forEach(function (f) {
            that.add(f);
        });
    },

    write: function (collector, sync, callback) {
        var reports = this.reports,
            verbose = this.config.verbose,
            handler = this.handleDone.bind(this, callback);

        this.inProgress = Object.keys(reports).length;

        Object.keys(reports).forEach(function (name) {
            var report = reports[name];
            if (verbose) {
                console.error('Write report: ' + name);
            }
            report.on('done', handler);
            report.writeReport(collector, sync);
        });
    },

    handleDone: function (callback) {
        this.inProgress -= 1;
        if (this.inProgress === 0) {
            return callback();
        }
    }
};

module.exports = Reporter;
