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
    var match = DATA_URI_RE.exec(url);

    if (match) {
        return new Buffer(match[1], 'base64').toString();
    }
    return loadRawMapFromFile(path.resolve(base, url));
}

function SourceMapCache() {
    this.files = {};
}

SourceMapCache.prototype = {
    addUrl: function (file, sourceMappingUrl) {
        var contents = rawMapFromUrl(sourceMappingUrl, path.dirname(file));
        if (contents) {
            try {
                this.addRawMap(file, JSON.parse(contents));
            } catch (ex) {
                console.error('Unable to parse JSON for source map');
            }
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

