'use strict';

// NOTE: all the requires here are of packages that don't exist.
// This is a test file that is never "run" per se...
//

let path = require('path');
let acorn = require('acorn');
let moduleName = require('./index.js');
let moduleExp = require(path.resolve('./sample.js'));

require('unass_w_function')();
require('unass_w_expression')(require('some_expression'));

module.exports = {};