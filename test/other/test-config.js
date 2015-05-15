var path = require('path'),
    configuration = require('../../lib/config'),
    oldCwd = process.cwd(),
    newCwd = path.resolve(__dirname, 'config-data'),
    config;

module.exports = {
    "when no explicit config is present": {
        setUp: function (cb) {
            config = configuration.loadObject(null);
            cb();
        },
        "verbose option should be set": function (test) {
            test.equal(false, config.verbose);
            test.done();
        },
        "default instrumentation options should be correct": function (test) {
            var iOpts = config.instrumentation;
            test.equal(process.cwd(), iOpts.root());
            test.equal(true, iOpts.defaultExcludes());
            test.equal(false, iOpts.embedSource());
            test.equal('__coverage__', iOpts.variable());
            test.equal(true, iOpts.compact());
            test.equal(false, iOpts.preserveComments());
            test.equal(false, iOpts.completeCopy());
            test.equal(false, iOpts.saveBaseline());
            test.equal(false, iOpts.includeAllSources());
            test.equal('./coverage/coverage-baseline.json', iOpts.baselineFile());
            test.deepEqual(['**/node_modules/**'], iOpts.excludes());
            test.deepEqual(['**/node_modules/**', '**/test/**', '**/tests/**'], iOpts.excludes(true));
            test.done();
        },
        "default reporting options should be correct": function (test) {
            var rOpts = config.reporting;
            test.equal('summary', rOpts.print());
            test.deepEqual( ['lcov'], rOpts.reports());
            test.equal('./coverage', rOpts.dir());
            test.equal('lcov.info', rOpts.reportConfig().lcovonly.file);
            test.done();
        },
        "default hook options should be correct": function (test) {
            var hOpts = config.hooks;
            test.equal(false, hOpts.hookRunInContext());
            test.equal(null, hOpts.postRequireHook());
            test.done();
        }
    },
    "when overrides passed in": {
        "as initial object": {
            "should use overrides": function (test) {
                config = configuration.loadObject({ instrumentation: { compact: false, 'save-baseline': true }});
                test.equal(false, config.instrumentation.compact());
                test.equal(true, config.instrumentation.saveBaseline());
                test.done();
            }
        },
        "as override object": {
            "should use overrides": function (test) {
                config = configuration.loadObject({},
                    { verbose: true, instrumentation: { compact: false, 'save-baseline': true }}
                );
                test.equal(true, config.verbose);
                test.equal(false, config.instrumentation.compact());
                test.equal(true, config.instrumentation.saveBaseline());
                test.done();
            }
        },
        "at both levels": {
            "should use override object values": function (test) {
                config = configuration.loadObject(
                    { verbose: true, instrumentation: { compact: false, 'save-baseline': true } },
                    { verbose: false, instrumentation: { compact: true, 'save-baseline': false } }
                );
                test.equal(false, config.verbose);
                test.equal(true, config.instrumentation.compact());
                test.equal(false, config.instrumentation.saveBaseline());
                test.done();
            }
        },
        "deeper in the tree": {
            "should use overrides": function (test) {
                config = configuration.loadObject({
                    reporting: {
                        'report-config': {
                            'lcovonly': {
                                file: 'foo.info'
                            }
                        }
                    }
                });
                test.equal('foo.info', config.reporting.reportConfig().lcovonly.file);
                test.equal('clover.xml', config.reporting.reportConfig().clover.file);
                test.equal(null, config.reporting.reportConfig().text.file);
                test.done();
            }
        }
    },
    "excludes array changes based on default excludes": {
        "should honor default excludes setting - when set" : function (test) {
            config = configuration.loadObject({
                instrumentation: {
                    "excludes": [ '**/vendor/**' ]
                }
            });
            var iOpts = config.instrumentation;
            test.deepEqual(['**/node_modules/**', '**/vendor/**'], iOpts.excludes());
            test.deepEqual(['**/node_modules/**', '**/test/**', '**/tests/**', '**/vendor/**'], iOpts.excludes(true));
            test.done();
        },
        "should honor default excludes setting - when not set" : function (test) {
            config = configuration.loadObject({
                instrumentation: {
                    "default-excludes": null,
                    "excludes": [ '**/vendor/**' ]
                }
            });
            var iOpts = config.instrumentation;
            test.deepEqual(['**/vendor/**'], iOpts.excludes());
            test.deepEqual(['**/vendor/**'], iOpts.excludes(true));
            test.done();
        },
        "should return nothing when defaults off and no excludes" : function (test) {
            config = configuration.loadObject({
                instrumentation: {
                    "default-excludes": null
                }
            });
            var iOpts = config.instrumentation;
            test.deepEqual([], iOpts.excludes());
            test.deepEqual([], iOpts.excludes(true));
            test.done();
        }
    },
    "when loading files": {
        "should fail on bad config file": function (test) {
            try {
                config = configuration.loadFile('/a/non/existent/path.js');
                test.fail();
            } catch (ex) {
                test.ok(1);
            }
            test.done();
        },
        "should use default config when no default file found": function (test) {
            config = configuration.loadFile();
            var defaultConfig = configuration.loadObject();
            test.deepEqual(config, defaultConfig);
            test.done();
        },
        "when files present": {
            setUp: function (cb) {
                process.chdir(newCwd);
                cb();
            },
            tearDown: function (cb) {
                process.chdir(oldCwd);
                cb();
            },
            "should use default YAML config when not explicit": function (test) {
                config = configuration.loadFile(undefined, { verbose: true });
                test.equal(false, config.instrumentation.compact());
                test.deepEqual(['lcov', 'cobertura'], config.reporting.reports());
                test.done();
            },
            "should use explicit file when provided": function (test) {
                config = configuration.loadFile('cfg.json', { verbose: true });
                test.equal(true, config.instrumentation.compact());
                test.deepEqual(['lcov'], config.reporting.reports());
                test.equal(true, config.instrumentation.saveBaseline());
                test.equal('yui-istanbul', config.hooks.postRequireHook());
                test.done();
            }
        }
    },
    "with custom watermarks": {
        "should load from sparse config": function (test) {
            config = configuration.loadObject({ reporting: { watermarks: { statements: [ 10, 90] } } });
            var w = config.reporting.watermarks();
            test.deepEqual([ 10, 90 ], w.statements);
            test.deepEqual([ 50, 80 ], w.branches);
            test.deepEqual([ 50, 80 ], w.functions);
            test.deepEqual([ 50, 80 ], w.lines);
            test.done();
        },
        "should not load any junk config": function (test) {
            config = configuration.loadObject({
                reporting: {
                    watermarks: {
                        statements: [ 10, 90, 95],
                        branches: [ -10, 70 ],
                        lines: [ 70, 110 ],
                        functions: [ 'a', 10 ]
                    }
                }
            });
            var w = config.reporting.watermarks();
            test.deepEqual([ 50, 80 ], w.statements);
            test.deepEqual([ 50, 80 ], w.branches);
            test.deepEqual([ 50, 80 ], w.functions);
            test.deepEqual([ 50, 80 ], w.lines);
            test.done();
        },
        "should not load any junk config (2)": function (test) {
            config = configuration.loadObject({
                reporting: {
                    watermarks: {
                        statements: [ 90, 80 ]
                    }
                }
            });
            var w = config.reporting.watermarks();
            test.deepEqual([ 50, 80 ], w.statements);
            test.deepEqual([ 50, 80 ], w.branches);
            test.deepEqual([ 50, 80 ], w.functions);
            test.deepEqual([ 50, 80 ], w.lines);
            test.done();
        }
    }
};
