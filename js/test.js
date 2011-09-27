var assert = require('assert');
var jsdom = require('jsdom');

jsdom.env(
    '<html><head></head><body><div id="test_widget">hi</div></body>', [
        './jquery-1.6.4.js',
        './mustache.js',
        './marimo.js'
    ],
    run_tests
);

function run_tests(errors, window) {
    var $ = window.$;
    console.log(window.marimo);
    assert.equal($('#test_widget').html(), 'hi', 'found test_widget html');
}
