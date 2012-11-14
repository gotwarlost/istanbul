Istanbul - a JS code coverage tool written in JS [![Build Status](https://secure.travis-ci.org/gotwarlost/istanbul.png)](http://travis-ci.org/gotwarlost/istanbul)
================================================

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

Writes reports using `coverage*.json` files as the source of coverage information. Reports are available in HTML and LCOV formats. Additional report formats may be plugged in at the library level.

Library usage
-------------

All the features of istanbul can be accessed as a library using its [public API](http://gotwarlost.github.com/istanbul/public/apidocs/index.html)

Changelog
---------

* v0.1.22 : Add signature attribute to cobertura method tags to fix NPE by the Hudson publisher
* v0.1.21 : Add cobertura XML report format; exprimental for now
* v0.1.20 : Fix HTML/ lcov report interface to be more customizable for middleware needs
* v0.1.19 : make all hooking non-destructive in that already loaded modules are never reloaded.
Add self-test mode so that already loaded istanbul modules can be unloaded prior to hooking.
* v0.1.18 : Add option to hook in non-destructive mode; i.e. the require cache is not unloaded when hooking
* v0.1.17 : Export some more objects; undocumented for now
* v0.1.16 : Fix npm keywords for istanbul which expects an array of strings but was being fed a single string with keywords instead
* v0.1.15 : Add the 'check-coverage' command so that Istanbul can be used as a posttest script to enforce minimum coverage
* v0.1.14 : Expose the experimental YUI load hook in the interface
* v0.1.13 : Internal jshint cleanup, no features or fixes
* v0.1.12 : Give npm the README that was getting inadvertently excluded
* v0.1.11 : Merge pull request #14 for HTML tweaks. Thanks @davglass. Add @davglass and @nowamasa as contributors in `package.json`
* v0.1.10 : Fix to issue #12. Do not install `uncaughtException` handler and pass input error back to CLI using a callback as opposed to throwing.
* v0.1.9 : Attempt to create reporting directory again just before writing coverage in addition to initial creation
* v0.1.8 : Fix issue #11.
* v0.1.7 : Add text summary and detailed reporting available as --print [summary|detail|both|none]. summary is the default if nothing specified.
* v0.1.6 : Handle backslashes in the file path correctly in emitted code. Fixes #9. Thanks to @nowamasa for bug report and fix
* v0.1.5 : make object-utils.js work on a browser as-is
* v0.1.4 : partial fix for issue #4; add titles to missing coverage spans, remove negative margin for missing if/else indicators
* v0.1.3 : Set the environment variable running_under_istanbul to 1 when that is the case. This allows test runners that use istanbul as a library to back off on using it when set.
* v0.1.2 : HTML reporting cosmetics. Reports now show syntax-colored JS using `prettify`. Summary tables no longer wrap in awkward places.
* v0.1.1 : Fixes issue #1. HTML reports use sources embedded inside the file coverage objects if found rather than reading from the filesystem
* v0.1.0 : Initial version

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


