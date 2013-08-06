/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var Command = require('./index.js'),
    util = require('util'),
    formatOption = require('../util/help-formatter').formatOption,
    VERSION = require('../util/meta').VERSION;

function HelpCommand() {
    Command.call(this);
}

HelpCommand.TYPE = 'help';
util.inherits(HelpCommand, Command);

Command.mix(HelpCommand, {
    synopsis: function () {
        return "shows help";
    },

    usage: function () {

        util.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' <command>\n');
        util.error('Available commands are:\n');

        var commandObj;
        Command.getCommandList().forEach(function (cmd) {
            commandObj = Command.create(cmd);
            util.error(formatOption(cmd, commandObj.synopsis()));
            util.error("\n");
        });
        util.error("Command names can be abbreviated as long as the abbreviation is unambiguous");
        util.error(this.toolName() + ' version:' + VERSION);
        util.error("\n");
    },
    run: function (args, callback) {
        var command;
        if (args.length === 0) {
            this.usage();
        } else {
            try {
                command = Command.create(args[0]);
                command.usage('istanbul', Command.resolveCommandName(args[0]));
            } catch (ex) {
                util.error('Invalid command: ' + args[0]);
                this.usage();
            }
        }
        return callback();
    }
});


module.exports = HelpCommand;


