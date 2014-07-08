YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "CloverReport",
        "CoberturaReport",
        "Collector",
        "Config",
        "Configuration",
        "ContentWriter",
        "FileWriter",
        "Hook",
        "HookOptions",
        "HtmlReport",
        "InstrumentOptions",
        "Instrumenter",
        "Istanbul",
        "JsonReport",
        "JsonSummaryReport",
        "LcovOnlyReport",
        "LcovReport",
        "LookupStore",
        "MemoryStore",
        "NoneReport",
        "ObjectUtils",
        "Report",
        "Reporter",
        "ReportingOptions",
        "Store",
        "TeamcityReport",
        "TextReport",
        "TextSummaryReport",
        "TmpStore",
        "Writer"
    ],
    "modules": [
        "config",
        "io",
        "main",
        "report",
        "store"
    ],
    "allModules": [
        {
            "displayName": "config",
            "name": "config",
            "description": "Object that returns instrumentation options"
        },
        {
            "displayName": "io",
            "name": "io",
            "description": "abstract interfaces for writing content"
        },
        {
            "displayName": "main",
            "name": "main",
            "description": "the top-level API for `istanbul`. provides access to the key libraries in\nistanbul so you can write your own tools using `istanbul` as a library.\n\nUsage\n-----\n\n     var istanbul = require('istanbul');"
        },
        {
            "displayName": "report",
            "name": "report",
            "description": "An abstraction for producing coverage reports.\nThis class is both the base class as well as a factory for `Report` implementations.\nAll reports are event emitters and are expected to emit a `done` event when\nthe report writing is complete.\n\nSee also the `Reporter` class for easily producing multiple coverage reports\nwith a single call.\n\nUsage\n-----\n\n     var Report = require('istanbul').Report,\n         report = Report.create('html'),\n         collector = new require('istanbul').Collector;\n\n     collector.add(coverageObject);\n     report.on('done', function () { console.log('done'); });\n     report.writeReport(collector);"
        },
        {
            "displayName": "store",
            "name": "store",
            "description": "An abstraction for keeping track of content against some keys (e.g.\noriginal source, instrumented source, coverage objects against file names).\nThis class is both the base class as well as a factory for `Store` implementations.\n\nUsage\n-----\n\n     var Store = require('istanbul').Store,\n         store = Store.create('memory');\n\n     //basic use\n     store.set('foo', 'foo-content');\n     var content = store.get('foo');\n\n     //keys and values\n     store.keys().forEach(function (key) {\n         console.log(key + ':\\n' + store.get(key);\n     });\n     if (store.hasKey('bar') { console.log(store.get('bar'); }\n\n\n     //syntactic sugar\n     store.setObject('foo', { foo: true });\n     console.log(store.getObject('foo').foo);\n\n     store.dispose();"
        }
    ]
} };
});