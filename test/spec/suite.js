"use strict";

let bruco = require('../../');
let path = require('path');

module.exports = function(test, Promise) {

    return Promise
    .resolve(path.resolve(`./test/sample.js`))
    .then(src => bruco(src))
    .then(res => {
        test.deepEqual(res, ['acorn','lodash'], 'Correctly finding packages');
    });
};