var foo =function () {
    var ret = 'foo';
    return ret;
};

function bar() {
    return 'bar';
}

console.log(foo() + foo() + bar());
