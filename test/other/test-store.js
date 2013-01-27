/*jslint nomen: true */
var Store = require('../../lib/store'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    foo = path.resolve(__dirname, 'data', 'foo.js'),
    baz = path.resolve(__dirname, 'data', 'baz.js'),
    anon = path.resolve(__dirname, 'data', 'does_not_exist.js'),
    fooContents = fs.readFileSync(foo, 'utf8'),
    bazContents = fs.readFileSync(baz, 'utf8');

module.exports = {
    "fslookup store should work correctly": function (test) {
        var store = Store.create('fslookup');

        store.set(foo, 'content');
        test.ok(store.hasKey(foo));
        test.ok(store.hasKey(baz));
        test.ok(!store.hasKey(anon));
        test.equal(0, store.keys().length);

        test.equals(fooContents, store.get(foo));
        test.equals(bazContents, store.get(baz));
        test.throws(function () {
            store.get(anon);
        });
        test.throws(function () {
            store.set(anon, 'foo');
        }, Error, /non-existent/);
        test.done();
    },

    "tmp store should work as expected": function (test) {
        var store = Store.create('tmp');

        test.equal(0, store.keys().length);
        store.set(foo, 'content');
        test.ok(store.hasKey(foo));
        test.ok(!store.hasKey(baz));
        test.equal(1, store.keys().length);
        store.set(baz, 'baz content');
        test.equal(2, store.keys().length);

        test.equals('content', store.get(foo));
        test.equals('baz content', store.get(baz));
        test.throws(function () {
            store.get(anon);
        });
        store.dispose();
        test.ok(!store.hasKey(foo));
        test.equal(0, store.keys().length);
        test.done();
    },

    "memory store should work as expected": function (test) {
        var store = Store.create('memory');

        test.equal(0, store.keys().length);
        store.set(foo, 'content');
        test.ok(store.hasKey(foo));
        test.ok(!store.hasKey(baz));
        test.equal(1, store.keys().length);
        store.set(baz, 'baz content');
        test.equal(2, store.keys().length);

        test.equals('content', store.get(foo));
        test.equals('baz content', store.get(baz));
        test.throws(function () {
            store.get(anon);
        });
        store.dispose();
        test.ok(!store.hasKey(foo));
        test.equal(0, store.keys().length);
        test.done();
    },

    "should be able to register a new store": function (test) {
        function NStore() {
        }
        NStore.prototype = {
            set: function (/* file, content */) { return 'x'; }
        };
        NStore.TYPE = 'nstore';

        Store.register(NStore);
        var store = Store.create('nstore');
        test.ok(store);
        test.equals('x', store.set('foo', 'bar'));
        test.done();
    },

    "should not be able to register an invalid store": function (test) {
        function NStore() {}
        test.throws(function () {
            Store.register(NStore);
        },
            /TYPE/);
        test.done();
    },

    "invalid store should not be created": function (test) {
        test.throws(
            function () { Store.create('foo'); },
            /Invalid store \[foo\], allowed values are /
        );
        test.done();
    },

    "should require overriding of all overrideables": function (test) {
        function NStore() {}
        NStore.TYPE = 'nstore';
        util.inherits(NStore, Store);
        Store.register(NStore);

        var store = Store.create('nstore'),
            asserter = function (fn) {
                test.throws(function () {
                    fn();
                },
                    /must be overridden/);
            };
        asserter(function () { store.set('foo', 'bar'); });
        asserter(function () { store.get('foo'); });
        asserter(function () { store.hasKey('foo'); });
        asserter(function () { store.keys(); });
        test.doesNotThrow(function () { store.dispose(); });
        test.done();
    }
};