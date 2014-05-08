(function(isNode) {
    "use strict";
    var Coffee_Instrumenter, StructuredCode, coffee, escodegen, estraverse, JS_Instrumenter, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key)) {
                child[key] = parent[key];
            }
        }
        function Ctor() {
            this.constructor = child;
        }
        Ctor.prototype = parent.prototype;
        child.prototype = new Ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    coffee = require('coffee-script-redux');

    JS_Instrumenter = require('./instrumenter');

    escodegen = require('escodegen');

    estraverse = require('estraverse');

    _ = require('lodash');

    StructuredCode = (function() {
        function StructuredCode(code) {
            this.cursors = this.generateOffsets(code);
            this.length = this.cursors.length;
        }

        StructuredCode.prototype.generateOffsets = function(code) {
            var cursor, reg, res, result;
            reg = /(?:\r\n|[\r\n\u2028\u2029])/g;
            result = [0];
            while ((res = reg.exec(code))) {
                cursor = res.index + res[0].length;
                reg.lastIndex = cursor;
                result.push(cursor);
            }
            return result;
        };

        StructuredCode.prototype.column = function(offset) {
            return this.loc(offset).column;
        };

        StructuredCode.prototype.line = function(offset) {
            return this.loc(offset).line;
        };

        StructuredCode.prototype.loc = function(offset) {
            var column, index, line;
            index = _.sortedIndex(this.cursors, offset);
            if (this.cursors.length > index && this.cursors[index] === offset) {
                column = 0;
                line = index + 1;
            } else {
                column = offset - this.cursors[index - 1];
                line = index;
            }
            return {
                column: column,
                line: line
            };
        };

        return StructuredCode;

    })();

    Coffee_Instrumenter = (function(_super) {
        
        function Coffee_Instrumenter(opt) {
            _super.call(this, opt);
        }
        
        __extends(Coffee_Instrumenter, _super);

        Coffee_Instrumenter.prototype.instrumentSync = function(code, filename) {
            var csast, program;
            filename = filename || ("" + (Date.now()) + ".js");
            if (typeof code !== 'string') {
                throw new Error('Code must be string');
            }
            csast = coffee.parse(code, {
                optimise: false,
                raw: true
            });
            program = coffee.compile(csast, {
                bare: true
            });
            this.fixupLoc(program, code);
            return this.instrumentASTSync(program, filename, code);
        };

        Coffee_Instrumenter.prototype.fixupLoc = function(program) {
            var structured;
            structured = new StructuredCode(program.raw);
            return estraverse.traverse(program, {
                leave: function(node) {
                var loc;
                if (node.range) {
                    loc = {
                            start: null,
                            end: structured.loc(node.range[1])
                    };
                    if (node.loc) {
                        loc.start = node.loc.start;
                    } else {
                        loc.start = structured.loc(node.range[0]);
                    }
                    node.loc = loc;
                } else {
                    node.loc = (function() {
                        var _ref;
                        switch (node.type) {
                        case 'BlockStatement':
                            return {
                                start: node.body[0].loc.start,
                                end: node.body[node.body.length - 1].loc.end
                            };
                        case 'VariableDeclarator':
                            if ((node? (_ref = node.init) ? _ref.loc : void 0 : void 0)) {
                                return {
                                    start: node.id.loc.start,
                                    end: node.init.loc.end
                                };
                            } else {
                                return node.id.loc;
                            }
                            break;
                        case 'ExpressionStatement':
                            return node.expression.loc;
                        case 'ReturnStatement':
                            if (node.argument) {
                                return node.argument.loc;
                            } else {
                                return node.loc;
                            }
                            break;
                        case 'VariableDeclaration':
                            return {
                                start: node.declarations[0].loc.start,
                                end: node.declarations[node.declarations.length - 1].loc.end
                            };
                        default:
                            return {
                                start: {
                                line: 0,
                                column: 0
                            },
                            end: {
                                line: 0,
                                column: 0
                            }
                            };
                        }
                    })();
                }
            }
            });
        };

        return Coffee_Instrumenter;

    })(JS_Instrumenter);

    if (isNode) {
        module.exports = Coffee_Instrumenter;
    } else {
        window.Instrumenter = Coffee_Instrumenter;
    }

}(typeof module !== 'undefined' && typeof module.exports !== 'undefined' && typeof exports !== 'undefined'));
