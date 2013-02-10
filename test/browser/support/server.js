/*jslint nomen: true */
var handlebars = require('handlebars'),
    path = require('path'),
    fs = require('fs'),
    templateFor = function (name) { return handlebars.compile(fs.readFileSync(path.resolve(__dirname, name), 'utf8')); },
    reader = function () {
        var args = Array.prototype.slice.call(arguments),
            file;
        args.unshift(__dirname);
        file = path.resolve.apply(null, args);
        return fs.readFileSync(file, 'utf8');
    },
    esprimaSource = reader('..', '..', '..', 'node_modules', 'esprima', 'esprima.js'),
    escodegenSource = reader('..', '..', '..', 'node_modules', 'escodegen', 'escodegen.browser.js'),
    vm = require('vm'),
    server;

function handleInitialPage(request, response) {
    response.setHeader('content-type', 'text/html');
    var template = templateFor('index.html');
    response.end(template({ demo: server.demo ? 'yes' : '' }));
}

function handleEsprima(request, response) {
    response.setHeader('content-type', 'application/javascript');
    response.end(esprimaSource, 'utf8');
}

function handleEscodegen(request, response) {
    response.setHeader('content-type', 'application/javascript');
    response.end(escodegenSource, 'utf8');
}

function handleInstrumenter(request, response) {
    response.setHeader('content-type', 'application/javascript');
    var iPath = path.resolve(__dirname, '..', '..', '..', 'lib', 'instrumenter.js'),
        instrumenterSource = fs.readFileSync(iPath, 'utf8');

    if (server.instrumenter) {
        response.end(server.instrumenter.instrumentSync(instrumenterSource, iPath), 'utf8');
    } else {
        response.end(instrumenterSource, 'utf8');
    }
}

function handleFile(request, response) {
    try {
        var file = path.resolve(server.rootPath, request.url.substring(1)),
            content;
        content = fs.readFileSync(file, 'utf8');
        response.setHeader('content-type', 'text/plain');
        response.end(content, 'utf8');
    } catch (ex) {
        console.error(ex.message);
        response.statusCode = 404;
        response.end();
    }
}

function getData(request, callback) {
    var data = '';
    request.setEncoding('utf8');
    request.on('data', function (rdata) { data += rdata; });
    request.on('end', function () {
        callback(data);
    });
}

function handleInstrumented(request, response) {
    var script,
        ok = true,
        err = null;
    getData(request, function (data) {
        server.emit('instrumented', request.url.substring(1), data);
        try {
            script = vm.createScript(data, request.url);
        } catch (ex) {
            console.error('Invalid JS returned for:' + request.url);
            ok = false;
            err = ex.message || ex.toString();
        }
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ ok: ok, err: err }), 'utf8');
    });
}

function handleEnd(request, response) {
    var ok = true,
        obj;
    getData(request, function (data) {
        try {
            obj = JSON.parse(data);
        } catch (ex) {
            console.error(ex.message || ex);
            console.error(ex.stack);
            ok = false;
        }
        server.emit('done', obj);
        response.end(JSON.stringify({ ok: ok }, 'utf8'));
    });
}

function handler(request, response) {
    console.log(request.method + ' ' + request.url);
    if (request.method === 'GET') {
        switch (request.url) {
        case '/':
            handleInitialPage(request, response);
            break;
        case '/_esprima.js':
            handleEsprima(request, response);
            break;
        case '/_escodegen.js':
            handleEscodegen(request, response);
            break;
        case '/_instrumenter.js':
            handleInstrumenter(request, response);
            break;
        default:
            handleFile(request, response);
            break;
        }
    } else if (request.method === 'POST') {
        switch (request.url) {
        case '/':
            handleEnd(request, response);
            break;
        default:
            handleInstrumented(request, response);
            break;
        }
    }
}

function create(port, instrumenter, root, demo) {
    server = require('http').createServer(handler);
    server.instrumenter = instrumenter;
    server.rootPath = root;
    server.listen(port);
    server.demo = demo;
    return server;
}

module.exports = {
    create: create
};

if (module === require.main) {
    (function () {
        var port = process.argv[2] || 9000;
        create(port, null, path.resolve(__dirname, '..', '..'), true);
        console.log('Listening on http://localhost:' + port + '/');
    }());
}
