var SMC = require('source-map').SourceMapConsumer,
    path = require('path'),
    fs = require('fs'),
    transformer = require('./source-map-transformer'),
    DATA_URI_RE = /^data:.+?base64,(.+)/;

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
        file;

    if (match) {
        contents = new Buffer(match[1], 'base64').toString();
    } else {
        file = path.resolve(base, url);
        contents = loadRawMapFromFile(file);
        baseDir = path.dirname(file);
    }
    if (contents) {
        return {
            contents: contents,
            baseDir: baseDir
        };
    }
}

function SourceMapCache() {
    this.files = {};
}

SourceMapCache.prototype = {
    addUrl: function (file, sourceMappingUrl) {
        var obj;
        var baseDir = process.cwd(),
            ret = rawMapFromUrl(sourceMappingUrl, baseDir);
        if (ret) {
            try {
                obj = JSON.parse(ret.contents);
            } catch (ex) {
                console.error('Unable to parse JSON for source map');
            }
            if (Array.isArray(obj.sources)) {
                obj.sources = obj.sources.map(function (s) {
                    return path.resolve(ret.baseDir, s);
                });
            }
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

