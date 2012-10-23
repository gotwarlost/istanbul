var path = require('path'),
    fs = require('fs'),
    istanbul = require('istanbul'),
    hook = istanbul.hook,
    Instrumenter = istanbul.Instrumenter,
    Collector = istanbul.Collector,
    instrumenter = new Instrumenter(),
    Report = istanbul.Report,
    collector,
    globalAdded = false,
    fileMap = {};

/**
 * Facade for all coverage operations support node as well as browser cases
 *
 * Usage:
 * ```
 *  //Node unit tests
 *  var coverage = require('/path/to/this/file');
 *  coverage.hookRequire(); // hooks require for instrumentation
 *  coverage.addInstrumentCandidate(file); // adds a file that needs to be instrumented; should be called before file is `require`d
 *
 *  //Browser tests
 *  var coverage = require('/path/to/this/file');
 *  var instrumentedCode = coverage.instrumentFile(file); //alternatively, use `instrumentCode` if you have already loaded the code
 *  //collect coverage from the browser
 *  // this coverage will be stored as `window.__coverage__`
 *  // and...
 *  coverage.addCoverage(coverageObject); // rinse and repeat
 *  ```
 *
 *  //in all cases, add an exit handler to the process
 *  process.once('exit', function () { coverage.writeReports(outputDir); }); //write coverage reports
 */

/**
 * adds a file as a candidate for instrumentation when require is hooked
 * @method addInstrumentCandidate
 * @param file the file to add as an instrumentation candidate
 */
function addInstrumentCandidate(file) {
    file = path.resolve(file);
    fileMap[file] = true;
}
/**
 * hooks require to instrument all files that have been specified as instrumentation candidates
 * @method hookRequire
 * @param verbose true for debug messages
 */
function hookRequire(verbose) {

    var matchFn = function (file) {
        var match = fileMap[file],
            what = match ? 'Hooking' : 'NOT hooking';
        if (verbose) { console.log(what + file); }
        return match;
    }, transformFn = instrumenter.instrumentSync.bind(instrumenter);

    hook.hookRequire(matchFn, transformFn);
}
/**
 * unhooks require hooks that have been installed
 * @method unhookRequire
 */
function unhookRequire() {
    hook.unhookRequire();
}
/**
 * returns the coverage collector, creating one if necessary and automatically
 * adding the contents of the global coverage object. You can use this method
 * in an exit handler to get the accumulated coverage.
 */
function getCollector() {
    if (!collector) {
        collector = new Collector();
    }

    if (globalAdded) { return collector; }

    if (global['__coverage__']) {
        collector.add(global['__coverage__']);
        globalAdded = true;
    } else {
        console.error('No global coverage found for the node process');
    }
    return collector;
}
/**
 * adds coverage to the collector for browser test cases
 * @param coverageObject the coverage object to add
 */
function addCoverage(coverageObject) {
    if (!collector) { collector = new Collector(); }
    collector.add(coverageObject);
}
/**
 * returns the merged coverage for the collector
 */
function getFinalCoverage() {
    return getCollector().getFinalCoverage();
}

/**
 * writes reports for an array of JSON files representing partial coverage information
 * @method writeReportsFor
 * @param fileList array of file names containing partial coverage objects
 * @param dir the output directory for reports
 */
function writeReportsFor(fileList, dir) {
    var collector = new Collector();
    fileList.forEach(function (file) {
        var coverage = JSON.parse(fs.readFileSync(file, 'utf8'));
        collector.addCoverage(coverage);
    });
    writeReportsInternal(dir, collector);
}

/**
 * writes reports for everything accumulated by the collector
 * @method writeReports
 * @param dir the output directory for reports
 */
function writeReports(dir) {
    writeReportsInternal(dir, getCollector());
}

function writeReportsInternal(dir, collector) {
    dir = dir || process.cwd();
    var reports = [
        Report.create('lcov', { dir: dir }),
        Report.create('text'),
        Report.create('text-summary')
    ];
    reports.forEach(function (report) { report.writeReport(collector, true); })
}
/**
 * returns the instrumented version of the code specified
 * @param {String} code the code to instrument
 * @param {String} file the file from which the code was load
 * @return {String} the instrumented version of the code in the file
 */
function instrumentCode(code, filename) {
    filename = path.resolve(filename);
    return instrumenter.instrumentSync(code, filename);
}
/**
 * returns the instrumented version of the code present in the specified file
 * @param file the file to load
 * @return {String} the instrumented version of the code in the file
 */
function instrumentFile(file) {
    filename = path.resolve(file);
    return instrumentCode(fs.readFileSync(file, 'utf8'), file);
}

module.exports = {
    addInstrumentCandidate: addInstrumentCandidate,
    hookRequire: hookRequire,
    unhookRequire: unhookRequire,
    instrumentCode: instrumentCode,
    instrumentFile: instrumentFile,
    addCoverage: addCoverage,
    writeReports: writeReports
};