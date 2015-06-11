/*jslint nomen: true */
var hook = require('../../lib/hook'),
    currentHook,
    matcher = function (file) { return file.indexOf('foo.js') > 0; },
    matcher2 = function (file) { return file.indexOf('bar.es6') > 0; },
    transformer = function () { return 'module.exports.bar = function () { return "bar"; };'; },
    transformer2 = function () { return 'module.exports.blah = function () { return "blah"; };'; },
    badTransformer = function () { throw "Boo!"; },
    scriptTransformer = function () { return '(function () { return 42; }());'; };

module.exports = {
    "when require is hooked": {
        setUp: function (cb) {
            currentHook = require('module')._extensions['.js'];
            hook.hookRequire(matcher, transformer, { verbose: true });
            cb();
        },
        tearDown: function (cb) {
            hook.unloadRequireCache(matcher);
            require('module')._extensions['.js'] = currentHook;
            cb();
        },

        "foo should be transformed": function (test) {
            var foo = require('./data/foo');
            test.ok(foo.bar);
            test.equals('bar', foo.bar());
            test.done();
        },

        "but baz should be skipped": function (test) {
            var foo = require('./data/baz');
            test.ok(foo.baz);
            test.equals('baz', foo.baz());
            test.done();
        },

        "twice it should save original code": function (test) {
            hook.hookRequire(matcher, transformer, { verbose: true });
            hook.unhookRequire();
            var foo = require('./data/foo');
            test.ok(foo.foo);
            test.equals('foo', foo.foo());
            test.done();
        },

        "postLoadHook should be called": function (test) {
            var called = null,
                opts = { postLoadHook: function (file) { called = file; }},
                foo;

            hook.unhookRequire();
            hook.hookRequire(matcher, transformer, opts);
            foo = require('./data/foo');
            test.ok(called.match(/foo\.js/));
            test.done();
        },

        "and cache should be un- and reloaded": function (test) {
            hook.unhookRequire();
            hook.hookRequire(matcher, transformer2);
            var foo = require('./data/foo');
            test.ok(foo.blah);
            test.equals('blah', foo.blah());
            test.done();
        },

        "bad transformer should return original code": function (test) {
            hook.unhookRequire();
            hook.hookRequire(matcher, badTransformer);
            var foo = require('./data/foo');
            test.ok(foo.foo);
            test.equals('foo', foo.foo());
            test.done();
        }
    },
    "when extensions are passed to hookRequire": {
        setUp: function(cb) {
            hook.hookRequire(matcher2, transformer2, { verbose: true, extensions: ['.es6'] });
            cb();
        },
        tearDown: function(cb) {
            hook.unloadRequireCache(matcher2);
            delete require('module')._extensions['.es6'];
            cb();
        },
        "bar should be transformed": function(test) {
            var bar = require('./data/bar');
            test.ok(bar.blah);
            test.equals('blah', bar.blah());
            test.done();
        },

        "but foo should be skipped": function (test) {
            var foo = require('./data/foo');
            test.ok(foo.foo);
            test.equals('foo', foo.foo());
            test.done();
        },
        "bad transformer should return original code": function (test) {
            hook.unhookRequire();
            hook.hookRequire(matcher2, badTransformer, { verbose: true, extensions: ['.es6'] });
            var bar = require('./data/bar');
            test.ok(bar.bar);
            test.equals('bar', bar.bar());
            test.done();
        }
    },
    "when createScript is hooked": {
        setUp: function (cb) {
            currentHook = require('vm').createScript;
            cb();
        },
        tearDown: function (cb) {
            require('vm').createScript = currentHook;
            cb();
        },
        "foo should be transformed (without any options)": function (test) {
            var s;
            hook.hookCreateScript(matcher, scriptTransformer);
            s = require('vm').createScript('(function () { return 10; }());', '/bar/foo.js');
            test.equals(42, s.runInThisContext());
            hook.unhookCreateScript();
            s = require('vm').createScript('(function () { return 10; }());', '/bar/foo.js');
            test.equals(10, s.runInThisContext());
            test.done();
        }
    },
	"when runInThisContext is hooked": {
        setUp: function (cb) {
            currentHook = require('vm').runInThisContext;
            cb();
        },
        tearDown: function (cb) {
            require('vm').runInThisContext = currentHook;
            cb();
        },
        "foo should be transformed": function (test) {
            var s;
            hook.hookRunInThisContext(matcher, scriptTransformer);
            s = require('vm').runInThisContext('(function () { return 10; }());', '/bar/foo.js');
            test.equals(42, s);
            hook.unhookRunInThisContext();
            s = require('vm').runInThisContext('(function () { return 10; }());', '/bar/foo.js');
            test.equals(10, s);
            test.done();
        },
        "code with no filename should not be transformed": function (test) {
            var s;
            hook.hookRunInThisContext(matcher, scriptTransformer);
            s = require('vm').runInThisContext('(function () { return 10; }());');
            test.equals(10, s);
            hook.unhookCreateScript();
            test.done();
        },
        "code with non-string filename should not be transformed": function (test) {
            var s;
            hook.hookRunInThisContext(matcher, scriptTransformer);
            s = require('vm').runInThisContext('(function () { return 10; }());', {});
            test.equals(10, s);
            hook.unhookCreateScript();
            test.done();
        }
	},
};
