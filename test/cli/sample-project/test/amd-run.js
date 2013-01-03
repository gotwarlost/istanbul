// RequireJS uses `vm.runInThisContext` see issue #23
// make sure we add hooks for it as well

var rjs = require('requirejs'),
    assert = require('assert');

rjs.config({
    baseUrl : __dirname,
    nodeRequire : require
});

rjs(['../amd/lorem'], function(lorem){
    var result = lorem(1, 2, 3);
    assert.equal(9, result);
});

