var dep = require('dependency'),
    vendor = require('../vendor/dummy_vendor_lib'),
    generator = require('./util/generate-names');

module.exports = function (useDep) {
    if (useDep) {
        dep.depBar();
    } else {
        vendor.vendorBar();
    }
};


