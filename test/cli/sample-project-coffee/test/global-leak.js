#!/usr/bin/env node

/*globals global */
var assert = require('assert'),
    g1 = {},
    g2 = {},
    keys;

function copyGlobals(target) {
    Object.keys(global).forEach(function (k) {
        target[k] = true;
    });
}

copyGlobals(g1);
//the intention is to ensure that no extra globals are created by the require below
//and that the coverage global is alive and well before the first piece of instrumented
//code is required
require('../lib/foo');
copyGlobals(g2);

Object.keys(g2).forEach(function (k) {
    if (g1[k]) { delete g2[k]; }
});

console.log(Object.keys(g2));
assert.equal(0, Object.keys(g2).length, 'New global var introduced in test');
keys = Object.keys(g1).filter(function (k) { return k.match(/\$\$cov_\d+\$\$/); });
assert.equal(1, keys.length, 'Coverage var not found!');

