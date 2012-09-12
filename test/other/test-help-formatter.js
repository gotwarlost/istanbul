var formatOption = require('../../lib/util/help-formatter').formatOption,
    THRESHOLD = 20;

module.exports = {
    "should format small option + text on a single line": function (test) {
        var formatted = formatOption('-f', 'specify force override of defaults');
        console.log(formatted);
        test.ok(formatted.indexOf('\n') < 0);
        test.done();
    },
    "should format small option + big text on multiple lines": function (test) {
        var formatted = formatOption('-f', 'an option whose description should exceed the length of a line if we have done our job well');
        console.log(formatted);
        test.ok(formatted.indexOf('\n') > THRESHOLD);
        test.done();
    },
    "should format long option + small text on multiple lines": function (test) {
        var formatted = formatOption('--[no]force', 'specify force override of defaults');
        console.log(formatted);
        test.ok(formatted.indexOf('\n') < THRESHOLD);
        test.ok(formatted.lastIndexOf('\n') < THRESHOLD);
        test.done();
    },
    "should format long option + big text on 3 lines": function (test) {
        var formatted = formatOption('--[no]force', 'an option whose description should exceed the length of a line if we have done our job well');
        console.log(formatted);
        test.ok(formatted.indexOf('\n') < THRESHOLD);
        test.ok(formatted.lastIndexOf('\n') > THRESHOLD);
        test.done();
    }
};