// # marimo tests
// this is a combination test suite / test runner for marimo. it relies on nodejs.
// at a high level, we're bootstrapping marimo.js (along with jquery and
// mustache) with jsdom for every test we want to run. we collect tests up into
// testcase objects and they can run in isolation in any order; each test gets
// a private window object.

// ## why?
// we didn't like existing unit test libraries for browser-side js. i have no
// interest in running my tests **in a browser**. i want to run them from the
// command line like other unit tests. our hope is to roll this bootstrapping
// technique into node-unit to avoid having to maintain our own test runner.
var assert = require('assert');
var jsdom = require('jsdom');

setTimeout = function(fun) { fun(); };

var testcase = {
    add: function add(testfun) {
        if (!this.tests) { this.tests = []; }
        this.tests.push(testfun);
    },
    run: function run() {
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

                    window.marimo.init(window.$);

                    try {
                        test(testcase);
                        console.log('✓ '+test.name);
                    }
                    catch (e) {
                        console.log('x '+test.name);
                        if (e.message) {
                            console.log('\t'+e.message);
                        }
                    }
                }
            );
        }, this);
    }
};

var marimo_obj_tc = Object.create(testcase);

// TODO should we bother testing the base widget? it doesn't do much and is
// really only there to be fed to Object.create().

// test the request_widget.

marimo_obj_tc.add(function test_add_widget(testcase) {
    var marimo = testcase.window.marimo;
    var widget_args = {
        murl: "/some/url",
        id: "123",
        widget_prototype:'request_widget'
    };
    marimo.add_widget(widget_args);
    assert.ok(marimo.widgets['123'], 'widget 123 added to marimo.widgets');
    assert.ok(marimo.requests['/some/url'], 'request for widget 123 exists');
});

marimo_obj_tc.add(function test_add_widgets(testcase) {
   var marimo = testcase.window.marimo;
   var widgets = [
       {widget_prototype:'request_widget', murl:'/some/url0', id:'0'},
       {widget_prototype:'request_widget', murl:'/some/url1', id:'1'},
       {widget_prototype:'request_widget', murl:'/some/url1', id:'2'}
   ];
   marimo.add_widgets(widgets);
   assert.equal(Object.keys(marimo.widgets).length, 3, 'see 3 widgets in marimo');
   assert.equal(Object.keys(marimo.requests).length, 2, 'see two requests in marimo');
   assert.equal(marimo.requests['/some/url1'].payloads.length, 2, 'see two widget requests for /some/url1');
});

marimo_obj_tc.add(function test_make_request(testcase) {
    var marimo = testcase.window.marimo;
    var requests_made = [];
    marimo.$.ajax = function(settings) {
        requests_made.push(settings);
    };
    var widgets = [
        {widget_prototype:'request_widget', murl:'/some/url0', id:'0'},
        {widget_prototype:'request_widget', murl:'/some/url1', id:'1'},
        {widget_prototype:'request_widget', murl:'/some/url1', id:'2'}
    ];
    marimo.add_widgets(widgets);
    marimo.make_request();
    assert.equal(requests_made.length, 2, 'two requests were made');
    var urls_requested = [requests_made[0]['url'], requests_made[1]['url']].sort();
    assert.deepEqual(urls_requested, ['/some/url0', '/some/url1'], 'requests made to appropriate urls');
});

marimo_obj_tc.add(function test_handle_response(testcase) {
    var marimo = testcase.window.marimo;
    var widgets = [
        {widget_prototype:'request_widget', murl:'/some/url0', id:'0'},
        {widget_prototype:'request_widget', murl:'/some/url1', id:'1'},
        {widget_prototype:'request_widget', murl:'/some/url1', id:'2'}
    ];
    marimo.add_widgets(widgets);
    var url = '/some/url1';
    var data = [
        {
            id:'1',
            template:"hi {{ name }}",
            context: { name: 'camus' }
        },
        {
            id:'2',
            template:"is the sky {{ status }}?",
            context: { status: 'alphabetical' }
        }
    ];
    marimo.handle_response(url, data);
    assert.equal(Object.keys(marimo.requests).length, 1, 'requests got cleaned up for url /some/url1');
    var div1text = marimo.$('#1').text();
    assert.equal(div1text, 'hi camus', 'html for div 1 is appropriate. got '+div1text);
    var div2text = marimo.$('#2').text();
    assert.equal(div2text, 'is the sky alphabetical?', 'html for div 2 is appropriate');
});

marimo_obj_tc.add(function test_emit(testcase) {
    var marimo = testcase.window.marimo;
    var event_fired = false;
    marimo.$(testcase.window.document).bind('test_event', function() { event_fired = true; });
    marimo.emit('test_event');
    assert.equal(marimo.events['test_event'], true, 'event firing was registered');
    assert.ok(event_fired, 'event was fired');
});

// TODO maybe this shouldn't be in this tc obj but eh
marimo_obj_tc.add(function test_on(testcase) {
    var marimo = testcase.window.marimo;
    // just use base widget
    marimo.add_widget({ id:'1' });
    var event_caught = false;
    marimo.widgets['1'].on('test_on', function() {
        event_caught = true;
    }, marimo.widgets['1']);
    marimo.emit('test_on');
    assert.ok(event_caught, 'test_on event was caught');
});

marimo_obj_tc.add(function test_onlist(testcase) {
    var marimo = testcase.window.marimo;
    marimo.add_widget({id:'1'});
    var listener_triggered = false;
    marimo.widgets['1'].on(['event1', 'event2', 'event3'], function() {
       listener_triggered = true;
    }, marimo.widgets['1']);
    // emit
    marimo.emit('event1');
    assert.equal(marimo.events['event1'], true, 'event1 registerd');
    assert.equal(listener_triggered, false, 'listener not triggered after event1');
    marimo.emit('event2');
    assert.equal(marimo.events['event2'], true, 'event2 registerd');
    assert.equal(listener_triggered, false, 'listener not triggered after event2');
    marimo.emit('event3');
    assert.equal(marimo.events['event3'], true, 'event3 registerd');
    assert.equal(listener_triggered, true, 'listener triggered after event3');
});

marimo_obj_tc.run();


// test writecapture widget
var wc_widget_tc = Object.create(testcase);

wc_widget_tc.add(function test_decode(testcase) {
    var marimo = testcase.window.marimo;
    var wcwidg = Object.create(marimo.widgetlib.writecapture_widget);
    var html = [
        '<head>',
        '<puke></puke>',
        '</head>',
        '<script>',
        '$ENDSCRIPT',
        'some junk'
    ].join('\n');
    var newhtml = wcwidg.decode(html);
    assert.ok(!newhtml.match(/\$ENDSCRIPT/g), 'do not see $ENDSCRIPT');
    assert.ok(newhtml.match(/<\/script>/g), 'do see </script>');
});

wc_widget_tc.add(function test_render_draw(testcase) {
    var marimo = testcase.window.marimo;
    marimo.$.writeCapture = {
        sanitize: function(str) {
            return "WROUGHTCAUGHT";
        }
    };
    marimo.add_widget({
        id:'1',
        widget_prototype:'writecapture_widget',
        html:'hi there',
        render_events:['render1', 'render2'],
        draw_events:['draw1', 'draw2']
    });
    marimo.$('body').append(marimo.$('<div id="1"></div>'));
    // once render events are ready, expect to see a this.safe_html
    assert.equal(typeof marimo.widgets['1'].safe_html, 'undefined');
    assert.equal(marimo.$('#1').text(), '');
    marimo.emit('render1');
    marimo.emit('render2');
    assert.equal(marimo.widgets['1'].safe_html, 'WROUGHTCAUGHT');
    assert.equal(marimo.$('#1').text(), '');
    // once draw events are ready, expect to see WROUGHTCAUGHT in the div
    marimo.emit('draw1');
    marimo.emit('draw2');
    assert.equal(marimo.$('#1').text(), 'WROUGHTCAUGHT');
});

wc_widget_tc.run();
