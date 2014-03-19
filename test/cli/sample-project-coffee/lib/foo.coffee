dep = require("dependency")
vendor = require("../vendor/dummy_vendor_lib")
generator = require("./util/generate-names")

# export what we need
module.exports = (input, useDep) ->
  base = generator.generateName()
  output = (if useDep then dep.depFoo(input) else vendor.vendorFoo(input))
  name: base
  value: output