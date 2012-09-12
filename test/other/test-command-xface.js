var Command = require('../../lib/command');

module.exports = {
    "should return command list": function (test) {
        var cmdList = Command.getCommandList();
        test.ok(cmdList.length > 0);
        cmdList.forEach(function (name) {
            var command = Command.create(name);
            test.ok(command.synopsis && command.synopsis());
            test.ok(command.usage && typeof command.usage === 'function');
            command.usage();
            test.ok(command.run && typeof command.run === 'function');
        });
        test.done();
    },
    "should run help for all commands without any barfs": function (test) {
        var cmdList = Command.getCommandList(),
            help = Command.create('help');
        help.run([]);
        help.run(['foobar']);
        help.run(['foobar', 'foobar', 'foobar']);
        cmdList.forEach(function (name) {
            if (name !== 'help') {
                help.run([ name ]);
            }
        });
        test.done();
    },
    "should throw on non-existent command": function (test) {
        test.throws(function () { Command.create('nonexistent-command'); },
            /existent/);
        test.done();
    }
};