'use strict';

// NOTE: all the requires here are of packages that don't exist.
// This is a test file that is never "run" per se...
//
let Body = require('./Body.jsx');
let React = require('react');
let ReactDOM = require('react-dom');

require('unassigned');
import something from 'somepackage-import/something';

window.renderBody = function() {
    ReactDOM.render(<Body />, document.querySelector('#react-component'));
};
