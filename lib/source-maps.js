var SMC = require('source-map').SourceMapConsumer,
    path = require('path'),
    fs = require('fs'),
    transformer = require('./source-map-transformer'),
    DATA_URI_RE = /^data:.+?base64,(.+)/;

// ugly function to return an existing file resolved against
// a bunch of relative paths in order. Would not be required
// if there were a spec on how relative paths in source maps
// should be resolved and if providers honored it
function firstFileOf(name, bases) {
    var ret = null;
    bases.forEach(function (b) {
        if (ret) {
            return;
        }
        var file = path.resolve(b, name);
        if (fs.existsSync(file)) {
            ret = file;
        }
    });
    return ret;
}

function loadRawMapFromFile(file) {
    try {
        return fs.readFileSync(file, 'utf8');
    } catch (ex) {
        console.error('Unable to load source map from: ' + file);
        return null;
    }
}

function rawMapFromUrl(url, base) {
    url = (url || '').toString();
    var match = DATA_URI_RE.exec(url),
        contents,
        baseDir = base,
        bases,
        file,
        obj;

    if (match) {
        contents = new Buffer(match[1], 'base64').toString();
    } else {
        file = firstFileOf(url, [baseDir, process.cwd()]);
        if (!file) {
            console.error('Unable to load source map for ' + url);
            return null;
        }
        contents = loadRawMapFromFile(file);
        if (!contents) {
            return null;
        }
        baseDir = path.dirname(file); // resolve sources in JSON relative to map file
    }
    try {
        obj = JSON.parse(contents);
    } catch (ex) {
        console.error('Unable to parse JSON for source map');
        return null;
    }

    bases = [];
    if (obj.sourceRoot) {
        bases.push(obj.sourceRoot);
    }
    bases.push(baseDir, process.cwd());

    if (obj.sources && Array.isArray(obj.sources)) {
        obj.sources = obj.sources.map(function (s) {
            var file = firstFileOf(s,bases);
            return file || s;
        });
    }
    return obj;
}

function SourceMapCache() {
    this.files = {};
}

SourceMapCache.prototype = {
    addUrl: function (file, sourceMappingUrl) {
        var baseDir = path.dirname(file),
            obj = rawMapFromUrl(sourceMappingUrl, baseDir);
        if (obj) {
            this.addRawMap(file, obj);
        }
    },
    addRawMap: function (file, sourceMapping) {
        this.files[file] = new SMC(sourceMapping);
    },
    hasMappings: function () {
        return Object.keys(this.files).length > 0;
    },
    transformer: function () {
        var files = this.files;
        if (!this.hasMappings()) {
            return null;
        }
        return transformer.create(function (file) {
            return files[file];
        });
    }
};

module.exports = {
    createCache: function () {
        return new SourceMapCache();
    }
};

