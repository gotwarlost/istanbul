var api = require('traceur/src/node/api.js'),
    path = require('path'),
    fs = require('fs'),
    bundlePath = path.join(__dirname, 'greeter.js'),
    file = path.resolve(__dirname, 'greeter.es6'),
    es6Code = fs.readFileSync(file, 'utf8');

module.exports = function (stream, cb) {
    var code = api.compile(es6Code, { sourceMaps: 'inline'}, file, file);
    stream.on('finish', cb);
    stream.write(code);
    stream.end();
};

if (require.main === module) {
    module.exports(fs.createWriteStream(bundlePath), function () {});
}

