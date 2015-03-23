var esprima = require('esprima');

function tryThis(str, feature) {
    try {
        /*jshint evil: true */
        eval(str);
    } catch (ex) {
        console.error('ES6 feature [' + feature + '] is not available in this environment');
        return false;
    }

   try {
       esprima.parse(str);
   } catch (ex) {
       console.error('ES6 feature [' + feature + '] is not yet supported by esprima mainline');
       return false;
   }

    return true;
}

module.exports = {
    isYieldAvailable: function () {
        return tryThis('function *foo() { yield 1; }', 'yield');
    },

    isForOfAvailable: function () {
        return tryThis('function *foo() { yield 1; }\n' +
            'for (var k of foo()) {}', 'for-of');
    },

    isArrowFnAvailable: function () {
        return tryThis('[1 ,2, 3].map(x => x * x)', 'arrow function');
    }
};
