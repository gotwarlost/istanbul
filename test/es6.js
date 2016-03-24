var esprima = require('esprima');

function tryThis(str, feature) {
    try {
        /*jshint evil: true */
        eval(str);
    } catch (ex) {
        console.error('ES6 feature [' + feature + '] is not available in this environment');
        return false;
    }

   // esprima parses sources with sourceType 'script' per default.
   // The only way to enable `import`/`export` is to parse as sourceType 'module'.
   try {
       try {
           esprima.parse(str);
       } catch (ex) {
           esprima.parse(str, { sourceType: 'module' });
       }
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

    isSuperAvailable: function () {
        return tryThis('class Test extends Object { constructor() { super(); } }\nnew Test();', 'super');
    },

    isForOfAvailable: function () {
        return tryThis('function *foo() { yield 1; }\n' +
            'for (var k of foo()) {}', 'for-of');
    },

    isArrowFnAvailable: function () {
        return tryThis('[1 ,2, 3].map(x => x * x)', 'arrow function');
    },

    isImportAvailable: function () {
        return tryThis('import fs from "fs"', 'import');
    },

    isExportAvailable: function () {
        // We can test instrumentation of exports even if the environment doesn't support them.
        return true;
    }
};
