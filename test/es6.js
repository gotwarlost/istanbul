
function tryThis(str) {
    try {
        /*jshint evil: true */
        eval(str);
        return true;
    } catch (ex) {
        return false;
    }
}

module.exports = {
    isYieldAvailable: function () {
        return tryThis('function *foo() { yield 1; }');
    }
};
