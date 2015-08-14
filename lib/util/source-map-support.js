var sourceMapSupport = require('source-map-support');

var sourceMaps = {};

// Implements a post-load hook that makes our generated files available to source-map-lookup
//
// Inspired by https://github.com/babel/babel/blob/master/packages/babel/src/api/register/node.js#L15
module.exports = function(transformer, instrumenter) {
  sourceMapSupport.install({
    handleUncaughtExceptions: false,
    retrieveSourceMap: function(filename) {
      var map = sourceMaps[filename];
      if (map) {
        return {
          map: map
        };
      }
    }
  });

  return function(code, filename) {
    var ret = transformer(code, filename);
    sourceMaps[filename] = instrumenter.lastSourceMap().toJSON();
    return ret;
  };
};
