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
            '<html><head></head><body><div id="1"></div><div id="2"></div></body>', [
                './jquery-1.6.4.js',
                './mustache.js',
                './marimo.js'
            ],
            function(err, window) {
                testcase.window = window;
                window.$.ajax = function(url, settings) {
                    var success = settings.success;
                    var error = settings.error;
                    var data = this.data ? this.data : {};
                    if (this.should_fail) {
                        error(data);
                    }
                    else {
                        success(data);
                    }
                };

                test(testcase);
                console.log('.');
            }
        );
    }, this);
};

TestCase.prototype.add = function(testfun) {
    this.tests.push(testfun);
};

var marimo_obj_tc = new TestCase();

marimo_obj_tc.add(function test_add_widget(testcase) {
    var window = testcase.window;
    var marimo = window.marimo;
    var widget_args = {
        murl: "/some/url",
        div_id: "123"
    };
    marimo.add_widget(widget_args);
    assert.ok(marimo.widgets['123'], 'widget 123 added to marimo.widgets');
    assert.ok(marimo.requests['/some/url'], 'request for widget 123 exists');
});

marimo_obj_tc.add(function test_add_widgets(testcase) {
   var window = testcase.window;
   var marimo = window.marimo;
   marimo.make_request = function() { };
   var widgets = [
       {murl:'/some/url0', div_id:'0'},
       {murl:'some/url1', div_id:'1'},
       {murl:'some/url1', div_id:'2'}
   ];
   marimo.add_widgets(widgets);
   assert.equal(Object.keys(marimo.widgets).length, 3, 'see 3 widgets in marimo');
   assert.equal(Object.keys(marimo.requests).length, 2, 'see two requests in marimo');
   assert.equal(marimo.requests['some/url1'].payloads.length, 2, 'see two widget requests for /some/url1');
});

marimo_obj_tc.add(function test_make_request(testcase) {
    var window = testcase.window;
    var marimo = window.marimo;
    var requests_made = [];
    window.$.ajax = function(url, settings) {
        requests_made.push([url,settings]);
    };
    var widgets = [
        {murl:'/some/url0', div_id:'0'},
        {murl:'/some/url1', div_id:'1'},
        {murl:'/some/url1', div_id:'2'}
    ];
    marimo.add_widgets(widgets);
    assert.equal(requests_made.length, 2, 'two requests were made');
    var urls_requested = [requests_made[0][0], requests_made[1][0]].sort();
    assert.deepEqual(urls_requested, ['/some/url0', '/some/url1'], 'requests made to appropriate urls');
});

marimo_obj_tc.add(function test_handle_response(testcase) {
    var window = testcase.window;
    var marimo = window.marimo;
    var widgets = [
        {murl:'/some/url0', div_id:'0'},
        {murl:'/some/url1', div_id:'1'},
        {murl:'/some/url1', div_id:'2'}
    ];
    // TODO add_widgets should NOT call make_request
    widgets.forEach(function(w) { marimo.add_widget(w); });
    var url = '/some/url1';
    var data = [
        {
            div_id:'1',
            template:"hi {{ name }}",
            context: { name: 'camus' },
        },
        {
            div_id:'2',
            template:"is the sky {{ status }}?",
            context: { status: 'alphabetical' }
        }
    ];
    marimo.handle_response(url, data);
    assert.equal(Object.keys(marimo.requests).length, 1, 'requests got cleaned up for url /some/url1');
    var div1text = window.$('#1').text();
    assert.equal(div1text, 'hi camus', 'html for div 1 is appropriate');
    var div2text = window.$('#2').text();
    assert.equal(div2text, 'is the sky alphabetical?', 'html for div 2 is appropriate');
});

marimo_obj_tc.run();
