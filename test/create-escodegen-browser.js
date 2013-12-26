#!/usr/bin/env node

var exec = require('child_process').exec,
    rimraf = require('rimraf'),
    path = require('path'),
    root = path.resolve(__dirname, '..'),
    escodegenPackage = path.resolve(root, 'node_modules', 'escodegen', 'package.json'),
    escodegen = require(escodegenPackage),
    version = escodegen.version,
    command = 'bower install escodegen#' + version;

function main() {
    var componentsDir = path.resolve(root, 'bower_components');
    console.log('rm -rf ' + componentsDir + '/');
    rimraf.sync(componentsDir);
    console.log(command);
    exec(command, { cwd: root, env: process.env }, function (err, stdout, stderr) {
        console.log(stdout);
        console.error(stderr);
        if (err) { throw err; }
    });
}

if (require.main === module) {
    main();
}
