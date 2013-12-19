## Ignoring code for coverage purposes

Some branches in JS code are typically hard, if not impossible to test.

Examples are a `hasOwnProperty` check, [UMD wrappers](https://github.com/umdjs/umd) and so on. Istanbul now has a
facility by which coverage can be excluded for certain sections of code.

### The interface

1. Coverage can be explicitly skipped using comments. There is no automatic pattern match of expressions to determine
if they should be skipped for coverage.
2. A coverage skip hint looks like `/* istanbul ignore <word>[non-word] [optional-docs] */`
3. For `if` conditions you can say `/* istanbul ignore if */` or `/* istanbul ignore else */` and that will end up
ignoring whichever path was required to be ignored.
4. For all other cases, the Swiss army knife `/* istanbul ignore next */` may be used which skips the "next thing" in
the source code
5. The "next" thing may be, among other things:
  * A JS statement (including assignments, ifs, loops, switches, functions) in which case all of the the statement is
  ignored for all forms of coverage.
  * A switch case statement, in which case the particular case is ignored for branch coverage and its contents ignored
  for all forms
  * A conditional inside a ternary expression in which case the branch is ignored
  * A part of a logical expression in which case that part of the expression is ignored for branch coverage
6. It is up to the caller to scope this as narrowly as possible. For example, if you have a source file that is wrapped
in a function expression, adding `/* istanbul ignore next */` at the top of the file will ignore the whole file!

### How it works

When some part of the JS is considered skipped, nothing actually happens in terms of changes to the instrumentation. Everything is calculated as though nothing was skipped - all that changes is that there is a `skip` attribute added to the metadata of the statement, function or branch as applicable.

Coverage reporting however takes the `skip` attribute into account and artificially increments counts, when 0 and skipped to pretend that the thing in question was covered. The HTML report shows the coverage after taking skips into account but at the same time colors the skipped statements with a gray color for easy visual scan.

This design makes it possible to report on either of the coverage numbers ("raw" v/s "processed"), show a count of statements/ functions/ branches skipped etc. The HTML and text summary reports display counts of how many statements, branches and functions were ignored.

### Some practical examples

#### Ignore an else path

```javascript
/* istanbul ignore else  */
if (foo.hasOwnProperty('bar')) {
    // do something
}
```

Usually istanbul would complain about missing coverage for the `else` branch but it won't do so because of the comment.

#### Ignore an if path

```javascript
/* istanbul ignore if  */
if (hardToReproduceError)) {
    return callback(hardToReproduceError);
}
```

In this case, you do not have to produce the error to have full branch coverage.

#### Ignore specific switch cases

```javascript
switch (foo) {
    case 1: /* some code */; break;
    /* istanbul ignore next */
    case 2: // really difficult to enter in a unit test for some reason
        someCode();
}
```

In the above example, the `case 2` branch is treated as covered.

#### Ignore default assignments

```javascript
var object = parameter || /* istanbul ignore next: tired of writing tests */ {};
```

In the above example, the entire line will be treated a covered even if you don't have a test for a falsy `parameter` value. In this example the trailing `: tired of writing tests` string is an explanatory comment for your future self. It can be anything.

#### Ignore specific conditions in an expression

```javascript
if (simpleError ||
    /* istanbul ignore next */ reallyDifficultToProduceError) {

}
```

You get the idea by now.

#### Ignore a UMD wrapper

```javascript
/* istanbul ignore next */
(function (root, factory) {
    'use strict';
    if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals
        root.module = factory();
    }
})(this, fn);
```

This will cause the entire function expression to be skipped for coverage.

