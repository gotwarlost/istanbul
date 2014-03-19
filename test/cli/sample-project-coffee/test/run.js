#!/usr/bin/env node

var assert = require('assert'),
    foo = require('../lib/foo'),
    bar = require('../lib/bar'),
    shouldFail = !!process.argv[2] && process.argv[2] !== '0';

var r1 = foo(3, true);
assert.ok(r1.name);
assert.ok(r1.name.match(/^gen/));
assert.equal(103, r1.value);

var r2 = foo(3, false);
assert.ok(r2.name);
assert.ok(r2.name.match(/^gen/));
assert.equal(3, r2.value);

var r3 = foo(30, false);
assert.ok(r3.name);
assert.ok(r3.name.match(/^gen/));
if (shouldFail) {
    assert.equal(40, r3.value);
} else {
    assert.equal(130, r3.value);
}
