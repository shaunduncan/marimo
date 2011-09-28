var assert = require('assert');
var jsdom = require('jsdom');

setTimeout = function(fun) { fun(); };

function TestCase() {
    this.tests = [];
}

TestCase.prototype.run = function() {
    this.tests.forEach(function(test){
        var testcase = {};
        jsdom.env(
            '<html><head></head><body><div id="test_widget">hi</div></body>', [
                './jquery-1.6.4.js',
                './mustache.js',
                './marimo.js'
            ],
            function(err, window) { testcase.window = window; test(testcase); }
        );
    }, this);
};

TestCase.prototype.add = function(testfun) {
    this.tests.push(testfun);
};

var marimo_obj_tc = new TestCase();
marimo_obj_tc.add(function(testcase) {
    var window = testcase.window;
    var marimo = window.marimo;
    marimo.add_widget({murl:"/some/url", div_id:"123"});
    assert.ok(marimo.widgets['123'], 'widget 123 added to marimo.widgets');
});
marimo_obj_tc.run();
