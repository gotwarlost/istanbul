var browserify = require('browserify'),
    path = require('path'),
    fs = require('fs'),
    bundlePath = path.join(__dirname, 'bundle.js');

module.exports = function (stream, cb) {
    browserify(null,{
        entry: true,
        debug: true
    }).require(require.resolve('./main.js'))
        .bundle()
        .on('error', function (err) { console.error(err); })
        .pipe(stream);

    stream.on('finish', cb);
};

if (require.main === module) {
    module.exports(fs.createWriteStream(bundlePath), function () {});
}

