'use strict';

let fs = require('fs-extra');
let acorn = require('acorn');
let types = require('ast-types');
let validate = require("validate-npm-package-name");
let _ = require('lodash');

module.exports = src => {

    if(!_.isArray(src)) {
        src = [src];
    }

    return _.uniq(src.reduce((acc, f) => {
        acc = acc.concat(findIn(f).filter(m => validate(m).validForNewPackages));
        return acc;
    }, []));

    function findIn(src) {

        let coll = [];

        src = fs.readFileSync(src, {encoding:'utf8'});

        // Quick check to save time building an AST on a file that won't match import | require
        //
        if(!/\b(import|require)\b/.test(src)) {
            return coll;
        }

        let ast = acorn.parse(src, {
            ecmaVersion: 6,
            sourceType: 'module',
            allowReserved: true,
            allowReturnOutsideFunction: true,
            allowHashBang: true
        });

        types.visit(ast, {
            visitImportDeclaration: function(path) {
                let node = path.node;
                if(node.source.type === 'Literal') {
                    // Get just the first segment of the import
                    //
                    coll.push(node.source.value.split('/')[0]);
                }
                this.traverse(path);
            },
            visitCallExpression: function(path) {

                let node = path.node;
                let args = node.arguments;

                if(!(node.callee.type === 'Identifier' && node.callee.name === 'require')) {
                    return false;
                }

                if(args.length && args[0].type === 'Literal') {
                    coll.push(args[0].value);
                }

                this.traverse(path);
            }
        });

        return coll;
    }
};