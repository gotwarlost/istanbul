/*jslint nomen:true*/
var path = require('path'),
    buildDir = path.resolve(__dirname, '..', 'build');

module.exports = {
    setSelfCover: function (flag) {
        process.env.SELF_COVER = flag ? 1 : '';
    },
    isSelfCover: function () {
        return process.env.SELF_COVER;
    },
    getBuildDir: function () {
        return buildDir;
    },
    getCoverageDir: function () {
        return path.resolve(buildDir, 'coverage');
    }
};

