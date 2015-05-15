var main = require('../../index');


module.exports = {
    "xface": function (test) {
        [ 'Instrumenter', 'Store', 'Collector', 'Report', 'Reporter', '_yuiLoadHook'].forEach(function (key) {
            test.ok(main[key] && typeof main[key] === 'function', key + ' was not exported as a function!');
        });
        [ 'hook', 'utils', 'config' ].forEach(function (key) {
            test.ok(main[key] && typeof main[key] === 'object', key + ' was not exported as an object!');
        });
        [ 'assetsDir'].forEach(function (key) {
            test.ok(main[key] && typeof main[key] === 'string', key + ' was not exported as a string!');
        });
        test.done();
    }
};