/*global phantom, window,document */
var system = require('system'),
    page = require('webpage').create(),
    args = Array.prototype.slice.call(system.args),
    script = args.shift(),
    port = args.shift(),
    files = args,
    done;

console.log('Connecting to localhost, port: ' + port);
console.log(files.length + ' files to be tested');

page.onConsoleMessage = function (msg) { console.log(msg); };
page.open('http://localhost:' + port + '/', function (status) {
    if (status !== 'success') {
        console.log('Unable to load main page!');
        phantom.exit();
    }
    console.log('Page loaded');
    window.setInterval(function () {
        done = page.evaluate(function (files) {
            if (!document.runningTests) {
                console.log('Load wait...');
                if (document.runTests) {
                    console.log('Start tests ...');
                    document.runningTests = true;
                    document.runTests(files);
                }
            } else {
                console.log('Wait...');
                if (document.done) {
                    console.log('All tests done');
                    return true;
                }
            }
            return false;
        }, files);
        if (done) {
            console.log('Exit phantom');
            phantom.exit();
        }
    }, 1000);
});






