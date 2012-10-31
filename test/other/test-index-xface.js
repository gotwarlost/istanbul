var main = require('../../index');

module.exports = {
    "xface": function (test) {
        test.ok(main.Instrumenter);
        test.ok(main.Store);
        test.ok(main.Collector);
        test.ok(main.Report);
        test.ok(main.hook);
        test.ok(main.utils);
        test.ok(main._yuiLoadHook && typeof main._yuiLoadHook === 'function');
        test.done();
    }
};