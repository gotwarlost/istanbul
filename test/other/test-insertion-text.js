/*jslint nomen: true */
var InsertionText = require('../../lib/util/insertion-text'),
    it;

module.exports = {
    "with a regular insertion text": {
        setUp: function (cb) {
            it = new InsertionText("hello world");
            cb();
        },
        "should be able to span hello": function (test) {
            it.insertAt(0, '<span class="h">');
            it.insertAt(5, '</span>');
            test.equals(it.toString(), '<span class="h">hello</span> world');
            test.done();
        },
        "should be able to span world": function (test) {
            it.insertAt(6, '<span class="w">');
            it.insertAt(11, '</span>');
            test.equals(it.toString(), 'hello <span class="w">world</span>');
            test.done();
        },
        "should be able to nest spans around hello (improperly)": function (test) {
            it.insertAt(0, '<span class="h">');
            it.insertAt(5, '</span>');
            it.insertAt(0, '<div class="w">');
            it.insertAt(5, '</div>');
            test.equals(it.toString(), '<span class="h"><div class="w">hello</span></div> world');
            test.done();
        },
        "should be able to nest spans around hello (properly)": function (test) {
            it.insertAt(0, '<span class="w">', true);
            it.insertAt(5, '</span>');
            it.insertAt(0, '<div class="h">', true);
            it.insertAt(5, '</div>');
            test.equals(it.toString(), '<div class="h"><span class="w">hello</span></div> world');
            test.done();
        },
        "should be able to use syntactic sugar for wrapping text": function (test) {
            it.wrap(0, '<span class="h">', 5, '</span>');
            it.wrap(0, '<div class="w">', 5, '</div>');
            test.equals(it.toString(), '<div class="w"><span class="h">hello</span></div> world');
            test.done();
        },
        "should be able to chain calls for wrapping text": function (test) {
            it.wrap(0, '<span class="h">', 5, '</span>').
                wrap(0, '<div class="w">', 5, '</div>');
            test.equals(it.toString(), '<div class="w"><span class="h">hello</span></div> world');
            test.done();
        },
        "should be able to insert text between two insertions": function (test) {
            it.wrap(0, '<span class="h">', 5, '</span>').
                insertAt(3, "w");
            test.equals(it.toString(), '<span class="h">helwlo</span> world');
            test.done();
        },
        "should prepend on negative insertion index": function (test) {
            it.insertAt(-3, "XXX");
            test.equals(it.toString(), 'XXXhello world');
            test.done();
        },
        "should append on out-of-bounds insertion index": function (test) {
            it.insertAt(100, "XXX");
            test.equals(it.toString(), 'hello worldXXX');
            test.done();
        },
        "should wrap entire line correctly": function (test) {
            it.wrapLine('<span>', '</span>');
            test.equals(it.toString(), '<span>hello world</span>');
            test.done();
        },
        "should be able to consume blanks in an individual call": function (test) {
            it = new InsertionText("  hello world  ");
            it.wrap(2, '<span>', 13, '</span>', true);
            test.equals(it.toString(), '<span>  hello world  </span>');
            test.done();
        }
    },
    "with a blank consuming insertion text and input with spaces on either end": {
        setUp: function (cb) {
            it = new InsertionText("    hello world    ", true);
            cb();
        },
        "spanning first word should consume leading spaces": function (test) {
            it.wrap(4, '<span class="h">', 9, '</span>');
            test.equals(it.toString(), '<span class="h">    hello</span> world    ');
            test.done();
        },
        "spanning second word should consume trailing spaces": function (test) {
            it.wrap(10, '<span class="h">', 15, '</span>');
            test.equals(it.toString(), '    hello <span class="h">world    </span>');
            test.done();
        },
        "should be able to suppress blank consumption in an individual call": function (test) {
            it = new InsertionText("  hello world  ");
            it.wrap(2, '<span>', 13, '</span>', false);
            test.equals(it.toString(), '  <span>hello world</span>  ');
            test.done();
        }
    }
};

