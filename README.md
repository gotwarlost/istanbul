Istanbul - a JS code coverage tool written in JS
================================================

[![Build Status](https://secure.travis-ci.org/gotwarlost/istanbul.png)](http://travis-ci.org/gotwarlost/istanbul)
[![Dependency Status](https://gemnasium.com/gotwarlost/istanbul.png)](https://gemnasium.com/gotwarlost/istanbul)

[![NPM](https://nodei.co/npm/istanbul.png?downloads=true)](https://nodei.co/npm/istanbul/) 

Features
--------

* All-javascript instrumentation library that tracks **statement, branch,
and function coverage** and reverse-engineers **line coverage** with 100% fidelity.
* **Module loader hooks** to instrument code on the fly
* **Command line tools** to run node unit tests "with coverage turned on" and no cooperation
whatsoever from the test runner
* **HTML** and **LCOV** reporting.
* Ability to use as **middleware** when serving JS files that need to be tested on the browser.
* Can be used on the **command line** as well as a **library**
* Based on the awesome `esprima` parser and the equally awesome `escodegen` code generator
* Well-tested on node 0.4.x, 0.6.x, 0.8.x and the browser (instrumentation library only)

Installing
----------

    $ npm install -g istanbul

Getting started
---------------

The best way to see it in action is to run node unit tests. Say you have a test
script `test.js` that runs all tests for your node project without coverage.

Simply:

    $ cd /path/to/your/source/root
    $ istanbul cover test.js

and this should produce a `coverage.json`, `lcov.info` and `lcov-report/*html` under `./coverage`

Sample of code coverage reports produced by this tool (for this tool!):

* [HTML reports](http://gotwarlost.github.com/istanbul/public/coverage/lcov-report/index.html)
* [Standard LCOV reports](http://gotwarlost.github.com/istanbul/public/coverage/std-lcov/index.html) (using `genhtml` on the lcov trace file)

Use cases
---------

Supports the following use cases and more

* transparent coverage of nodejs unit tests
* ability to use in an <code>npm test</code> script for conditional coverage
* instrumentation of files in batch mode for browser tests (using yeti for example)
* Server side code coverage for nodejs by embedding it as custom middleware


The command line
----------------

    $ istanbul help

gives you detailed help on all commands.

Usage: istanbul help <command>

Available commands are:

      check-coverage
              checks overall coverage against thresholds from coverage JSON
              files. Exits 1 if thresholds are not met, 0 otherwise


      cover   transparently adds coverage information to a node command. Saves
              coverage.json and reports at the end of execution


      help    shows help


      instrument
              instruments a file or a directory tree and writes the
              instrumented code to the desired output location


      report  writes reports for coverage JSON objects produced in a previous
              run


      test    cover a node command only when npm_config_coverage is set. Use in
              an `npm test` script for conditional coverage


Command names can be abbreviated as long as the abbreviation is unambiguous

The `cover` command
-------------------

    $ istanbul cover my-test-script.js -- my test args
    # note the -- between the command name and the arguments to be passed

The `cover` command can be used to get a coverage object and reports for any arbitrary
node script. By default, coverage information is written under `./coverage` - this
can be changed using command-line options.

The `test` command
-------------------

The `test` command has almost the same behavior as the `cover` command, except that
it skips coverage unless the `npm_config_coverage` environment variable is set.

This helps you set up conditional coverage for tests. In this case you would
have a `package.json` that looks as follows.

    {
        "name": "my-awesome-lib",
        "version": "1.0",
        "script": {
            "test": "istanbul test my-test-file.js"
        }
    }

Then:

    $ npm test # will run tests without coverage

And:

    $ npm test --coverage # will run tests with coverage

**Note**: This needs `node 0.6` or better to work. `npm` for `node 0.4.x` does
not support the `--coverage` flag.

The `instrument` command
------------------------

Instruments a single JS file or an entire directory tree and produces an output directory tree with instrumented code. This should not be required for running node unit tests but is useful for tests to be run on the browser (using `yeti` for example).

The `report` command
-------------------

Writes reports using `coverage*.json` files as the source of coverage information. Reports are available in the following formats:

* html - produces a bunch of HTML files with annotated source code
* lcovonly - produces an lcov.info file
* lcov - produces html + lcov files. This is the default format
* cobertura - produces a cobertura-coverage.xml file for easy Hudson integration
* text-summary - produces a compact text summary of coverage, typically to console
* text - produces a detailed text table with coverage for all files
* teamcity - produces service messages to report code coverage to TeamCity

Additional report formats may be plugged in at the library level.

Library usage
-------------

All the features of istanbul can be accessed as a library using its [public API](http://gotwarlost.github.com/istanbul/public/apidocs/index.html)

Changelog
---------

Changelog has been moved [here](https://github.com/gotwarlost/istanbul/blob/master/CHANGELOG.md).

License
-------

istanbul is licensed under the [BSD License](http://github.com/gotwarlost/istanbul/raw/master/LICENSE).

Third-party libraries
---------------------

The following third-party libraries are used by this module:

* abbrev: https://github.com/isaacs/abbrev-js -  to handle command abbreviations
* async: https://github.com/caolan/async - for parallel instrumentation of files
* escodegen: https://github.com/Constellation/escodegen - for JS code generation
* esprima: https://github.com/ariya/esprima - for JS parsing
* fileset: https://github.com/mklabs/node-fileset - for loading and matching path expressions
* handlebars: https://github.com/wycats/handlebars.js/ - for report template expansion
* mkdirp: https://github.com/substack/node-mkdirp - to create output directories
* nodeunit: https://github.com/caolan/nodeunit - dev dependency for unit tests
* nopt: https://github.com/isaacs/nopt - for option parsing
* resolve: https://github.com/substack/node-resolve - for resolving a post-require hook module name into its main file.
* rimraf - https://github.com/isaacs/rimraf - dev dependency for unit tests
* which: https://github.com/isaacs/node-which - to resolve a node command to a file for the `cover` command
* wordwrap: https://github.com/substack/node-wordwrap - for prettier help
* prettify: http://code.google.com/p/google-code-prettify/ - for syntax colored HTML reports. Files checked in under `lib/vendor/`

Inspired by
-----------

* YUI test coverage - https://github.com/yui/yuitest - the grand-daddy of JS coverage tools. Istanbul has been specifically designed to offer an alternative to this library with an easy migration path.
* cover: https://github.com/itay/node-cover - the inspiration for the `cover` command, modeled after the `run` command in that tool. The coverage methodology used by istanbul is quite different, however

Shout out to
------------

   * [mfncooper](https://github.com/mfncooper) - for great brainstorming discussions
   * [reid](https://github.com/reid), [davglass](https://github.com/davglass), the YUI dudes, for interesting conversations, encouragement, support and gentle pressure to get it done :)

Why the funky name?
-------------------

Since all the good ones are taken. Comes from the loose association of ideas across coverage, carpet-area coverage, the country that makes good carpets and so on...


