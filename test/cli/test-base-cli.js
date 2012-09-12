/*jslint nomen: true */
var path = require('path'),
    helper = require('../cli-helper');

module.exports = {
    setUp: function (cb) {
        helper.resetOpts();
        cb();
    },
    "should provide helpful errors when nothing passed": function (test) {
        helper.runCommand(null, [], function (results) {
            test.ok(!results.succeeded());
            test.ok(results.grepError(/Try "istanbul help" for usage/));
            test.done();
        });
    },
    "should provide helpful errors when only flags passed in": function (test) {
        helper.runCommand(null, [ '-v', '-x' ], function (results) {
            test.ok(!results.succeeded());
            test.ok(results.grepError(/Try "istanbul help" for usage/));
            test.done();
        });
    },
    "should provide a good message on an invalid command": function (test) {
        helper.runCommand('instrumentation', [ '--root', 'a/nonexistent/path' ], function (results) {
            test.ok(!results.succeeded());
            test.ok(results.grepError(/Invalid command \[instrumentation\], allowed values/));
            test.ok(results.grepError(/Try "istanbul help" for usage/));
            test.done();
        });
    },
    "should print a stack trace on uncaught exception": function (test) {
        helper.runCommand('instrument', [ '--root', 'a/nonexistent/path' ], function (results) {
            test.ok(!results.succeeded());
            test.ok(!results.grepError(/Try "istanbul help" for usage/));
            test.ok(results.grepError(/ENOENT/));
            test.done();
        });
    }
};
