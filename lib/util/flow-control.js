/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */


/**
 * Wrap a function and make sure it's called only once.
 *
 * @param {Function} func Function to wrap.
 * @return {Function} Wrapped function.
 */
function callOnce(func) {
    var called = false;

    return function wrapped() {
        if (!called) {
            called = true;
            func.apply(null, arguments);
        }
    };
}

module.exports = {
    'callOnce': callOnce
};
