var i = 10;
foo: while (i--) {
    if (i === 2) break foo;
    console.log(i);
}
