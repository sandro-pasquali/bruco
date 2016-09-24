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
//                      If a String convert to Array.
// @param [opts] {Object}
// @param opts.ignore {Array}   Additional ignores should this be a globbing action.
// @param opts.all {Function}   Sent every require string etc. found.
//
module.exports = (src, opts={}) => {

    let ignore = opts.ignore || [];
    let getAll = opts.all;
    let all = new Set();

    if(!_.isArray(src)) {
        if(!_.isString(src)) {
            throw new Error(`First argument must be String path, or Array of paths. Received: ${src}`);
        }

        src = [src];
    }

    // Get a unique list of all required packages filtering out any that
    // are not valid (modern) npm package names.
    // @see https://www.npmjs.com/package/validate-npm-package-name
    //
    function fetch(s) {
        let pack = _.uniq(s.reduce((acc, f) => {
            acc = acc.concat([...findIn(f)].filter(m => validate(m).validForNewPackages));
            return acc;
        }, []));

        return pack;
    }

    let res = fetch(src);

    getAll && getAll([...all]);

    return res;

    function findIn(src) {

        let coll = new Set();
        let stat;

        if(_.isArray(src)) {
            return new Set(fetch(src));
        }

        try {
            stat = fs.statSync(src);
        } catch(e) {
            debug('ERROR:', e.message);
            return coll;
        }

        // If a directory, find all relevant files and re-call
        //
        if(stat.isDirectory()) {
            return new Set(fetch(glob.sync(path.join(src, `**/*.{js,jsx}`), {
                ignore: ['**/node_modules/**'].concat(ignore)
            })));
        }

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