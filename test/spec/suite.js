"use strict";

let bruco = require('../../');
let path = require('path');
let _ = require('lodash');
let debug = require('debug')('bruco-test');
let pack = require('../../package.json');

module.exports = function(test, Promise) {

    let deps = _.uniq(Object.keys(pack.dependencies).concat(Object.keys(pack.devDependencies)));

    // Find packages in this repo. Note (naive) sort at end.
    //
    return Promise
    .resolve(bruco(path.resolve('./'), {
        ignore : [
            '**/node_modules/**'
        ],
        all : a => debug('ALL:', a)
    }).sort())
    .then(found => {

        // Which packages in package.json are NOT in the package list we found.
        //
        let diff = _.difference(found, deps);

        debug('FOUND:', found);
        debug('PACKAGE.JSON:', deps);
        debug('DIFF:', diff);

        // We should have found everything in package.json, and what remains
        // should be the silly/uninstalled packages in sample.jsx
        //
        test.deepEqual(diff, [
            'react',
            'react-dom',
            'some_expression',
            'somepackage-import',
            'unass_w_expression',
            'unass_w_function',
            'unassigned'
        ], 'Correctly finding packages');
    });
};
