'use strict';

let fs = require('fs-extra');
let path = require('path');
let acorn = require('acorn');
let types = require('ast-types');
let babel = require('babel-core');
let debug = require('debug')('bruco');
let validate = require('validate-npm-package-name');
let glob = require('glob');
let _ = require('lodash');

// @param src {Mixed}   If an Array, assume array of file paths.
//                      If a String, check if directory or file path.
//                      If directory, glob for ALL js, jsx, etc. recursive.
//                      If a file, convert to Array and process.
// @param [opts] {Object}
// @param opts.ignore {Array}   Additional ignores should this be a globbing action.
// @param opts.all {Function}   Sent every require string etc. found.
//
module.exports = (src, opts={}) => {

    let stat;
    let pack;
    let ignore = opts.ignore || [];
    let getAll = opts.all;
    let all = new Set();

    if(!_.isArray(src)) {
        if(!_.isString(src)) {
            throw new Error(`First argument must be String path, or Array of paths. Received: ${src}`);
        }

        stat = fs.statSync(src);

        if(stat.isFile()) {
            src = [src];
        }

        if(stat.isDirectory()) {
            src = glob.sync(path.join(src, `**/*.{js,jsx}`), {
                ignore: ['**/node_modules/**'].concat(ignore)
            })
        }
    }

    // Get a unique list of all required packages filtering out any that
    // are not valid (modern) npm package names. Note sort at end.
    // @see https://www.npmjs.com/package/validate-npm-package-name
    //
    pack = _.uniq(src.reduce((acc, f) => {
        acc = acc.concat([...findIn(f)].filter(m => validate(m).validForNewPackages));
        return acc;
    }, []));

    getAll && getAll([...all]);

    return pack;

    function findIn(src) {

        let coll = new Set();

        if(path.extname(src) === '.jsx') {
            debug("PROCESSING -JSX- FILE:", src);
            src = babel.transformFileSync(src, {
                presets: ['react']
            }).code;

        } else {
            debug("PROCESSING -JS- FILE:", src);
            src = fs.readFileSync(src, {encoding:'utf8'});
        }

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

            // NOTE:
            // When using `import` or `require` w/ subpaths, e.g:
            //  import map from 'lodash/map'
            //  const map = require('lodash/map')
            // Just grab the module name (lose everything after first `/`)
            //
            visitImportDeclaration: function(path) {

                let ns = path.node.source;

                if(ns.type === 'Literal') {
                    // Get just the first segment of the import
                    //
                    coll.add(ns.value.split('/')[0]);
                    getAll && all.add(ns.value);
                }
                this.traverse(path);
            },

            visitCallExpression: function(path) {

                let node = path.node;
                let args = node.arguments;

                if(node.callee.name === 'require' && args.length && args[0].type === 'Literal') {
                    coll.add(args[0].value.split('/')[0]);
                    getAll && all.add(args[0].value);
                }

                this.traverse(path);
            }
        });

        return coll;
    }
};