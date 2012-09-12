var inputError = require('../../lib/util/input-error');

module.exports = {
    "should produce an Error object distinguishable from unexpected errors": function (test) {
        var e = inputError.create('bad user!');
        test.equal('bad user!', e.message);
        test.ok(e.inputError);
        test.done();
    }
};