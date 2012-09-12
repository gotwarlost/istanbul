module.exports = {
    vendorFoo: function (input) {
        return input < 10 ? input : input + 100;
    },
    vendorBar: function () {
        throw new Error("Let's not call this function in tests");
    }
};

