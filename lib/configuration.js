var path = require('path'),
    fs = require('fs'),
    CAMEL_PATTERN = /([a-z])([A-Z])/g,
    YML_PATTERN = /\.ya?ml$/,
    yaml = require('js-yaml');

function defaultConfig() {
    return {
        verbose: false,
        instrumentation: {
            root: '.',
            'default-excludes': true,
            excludes: [],
            'embed-source': false,
            variable: '__coverage__',
            compact: true,
            'preserve-comments': false,
            'complete-copy': false,
            'save-baseline': false,
            'baseline-file': './coverage/coverage-baseline.json'
        },
        reporting: {
            print: 'summary',
            reports: [ 'lcov' ],
            dir: './coverage',
            watermarks: {
                statements: [ 50, 80 ],
                functions: [ 50, 80 ],
                branches: [ 50, 80 ]
            }
        },
        hooks: {
            'hook-run-in-context': false,
            'post-require-hook': null
        },
        thresholds: {
            statements: 0,
            branches: 0,
            functions: 0
        }
    };
}

function dasherize(word) {
    return word.replace(CAMEL_PATTERN, function (match, lch, uch) {
        return lch + '-' + uch.toLowerCase();
    });
}
function isScalar(v) {
    if (v === null) { return true; }
    return v !== undefined && !Array.isArray(v) && typeof v !== 'object';
}

function isObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function mergeObjects(explicit, template) {

    var ret = {};

    Object.keys(template).forEach(function (k) {
        var v1 = template[k],
            v2 = explicit[k];

        if (Array.isArray(v1)) {
            ret[k] = Array.isArray(v2) && v2.length > 0 ? v2 : v1;
        } else if (isObject(v1)) {
            v2 = isObject(v2) ? v2 : {};
            ret[k] = mergeObjects(v2, v1);
        } else {
            ret[k] = isScalar(v2) ? v2 : v1;
        }
    });
    return ret;
}

function mergeDefaults(explicit, implicit) {
    return mergeObjects(explicit || {}, implicit);
}

function addMethods() {
    var args = Array.prototype.slice.call(arguments),
        cons = args.shift();

    args.forEach(function (arg) {
        var method = arg,
            property = dasherize(arg);
        cons.prototype[method] = function () {
            return this.config[property];
        };
    });
}

function InstrumentOptions(config) {
    this.config = config;
}

addMethods(InstrumentOptions,
    'defaultExcludes', 'completeCopy',
    'embedSource', 'variable', 'compact', 'preserveComments',
    'saveBaseline', 'baselineFile');

InstrumentOptions.prototype.root = function () { return path.resolve(this.config.root); };
InstrumentOptions.prototype.excludes = function (excludeTests) {
    var defaults;
    if (this.defaultExcludes()) {
        defaults = [ '**/node_modules/**' ];
        if (excludeTests) {
            defaults = defaults.concat(['**/test/**', '**/tests/**']);
        }
        return defaults.concat(this.config.excludes);
    }
    return this.config.excludes;
};

function ReportingOptions(config) {
    this.config = config;
}

addMethods(ReportingOptions, 'print', 'reports', 'dir');

function HookOptions(config) {
    this.config = config;
}

addMethods(HookOptions, 'hookRunInContext', 'postRequireHook');

function Configuration(obj, overrides) {

    var config = mergeDefaults(obj, defaultConfig());
    if (isObject(overrides)) {
        config = mergeDefaults(overrides, config);
    }
    if (config.verbose) {
        console.error('Using configuration');
        console.error('-------------------');
        console.error(yaml.dump(config));
        console.error('-------------------\n');
    }
    this.verbose = config.verbose;
    this.instrumentation = new InstrumentOptions(config.instrumentation);
    this.reporting = new ReportingOptions(config.reporting);
    this.hooks = new HookOptions(config.hooks);
    //this.thresholds = new ThresholdOptions(config.thresholds);
}

function loadFile(file, overrides) {
    var defaultConfigFile = path.resolve('.istanbul.yml'),
        configObject;

    if (file) {
        if (!fs.existsSync(file)) {
            throw new Error('Invalid configuration file specified:' + file);
        }
    } else {
        if (fs.existsSync(defaultConfigFile)) {
            file = defaultConfigFile;
        }
    }

    if (file) {
        configObject = file.match(YML_PATTERN) ?
            yaml.safeLoad(fs.readFileSync(file, 'utf8'), { filename: file }) :
            require(path.resolve(file));
    }

    return new Configuration(configObject, overrides);
}

function loadObject(obj, overrides) {
    return new Configuration(obj, overrides);
}

module.exports = {
    loadFile: loadFile,
    loadObject: loadObject
};

