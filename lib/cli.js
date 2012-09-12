#!/usr/bin/env node

/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */


var path = require('path'),
    hook = require('./hook'),
    Command = require('./command'),
    inputError = require('./util/input-error'),
    Store = require('./store'),
    Report = require('./report');

require('./register-plugins');

function findCommandPosition(args) {
    var i;

    for (i = 0; i < args.length; i += 1) {
        if (args[i].charAt(0) !== '-') {
            return i;
        }
    }

    return -1;
}

process.once('uncaughtException', function (ex) {
    console.error(ex.message || ex);
    if (!ex.inputError) {
        console.error(ex.stack);
    } else {
        console.error('Try "istanbul help" for usage');
    }
    process.exit(1);
});

function runCommand(args) {
    var pos = findCommandPosition(args),
        command,
        commandArgs,
        opts,
        commandObject;

    if (pos < 0) {
        throw inputError.create('Need a command to run');
    }

    commandArgs = args.slice(0, pos);
    command = args[pos];
    commandArgs.push.apply(commandArgs, args.slice(pos + 1));

    try {
        commandObject = Command.create(command);
    } catch (ex) {
        throw inputError.create(ex.message);
    }
    commandObject.run(commandArgs);
}

if (require.main === module) {
    var args = Array.prototype.slice.call(process.argv, 2);
    runCommand(args);
}

module.exports = {
    runCommand: runCommand
};

