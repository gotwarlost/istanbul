var dep = require('dependency'),
    vendor = require('../vendor/dummy_vendor_lib'),
    generator = require('./util/generate-names');

module.exports = function (input, useDep) {
    var base = generator.generateName(),
        output = useDep
            ? dep.depFoo(input)
            : vendor.vendorFoo(input);
    return { name: base, value: output };
};

