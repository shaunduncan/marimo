var jsdom = require('jsdom')
var _ = require('underscore')

setTimeout = function(fun) { fun(); }

function jsdomwrapper(cb) {
    var testcase = this
    jsdom.env('<html><head></head><body><div id="one"></div><div id="two"></div></body>',
        [
            './jquery-1.6.4.js',
            './mustache.js',
            './marimo.js'
        ], function(err, window) {
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
            }

            window.marimo.init(window.$)

            testcase.window = window
            cb()
        }
    )
}

exports.marimo_obj = {
    setUp: jsdomwrapper,
    test_dom_sanity: function(test) {
        var $ = this.window.$
        test.ok(this.window, 'window exists')
        test.ok(this.window.marimo, 'marimo exists')
        test.ok($, 'window.$ exists')
        test.equal($('#one').length, 1, 'found a div')
        test.done()
    },
    test_add_widget_defaults: function(test) {
        var marimo = this.window.marimo
        var widget_args = { }
        marimo.add_widget(widget_args)

        var keys = Object.keys(marimo.widgets)

        test.equal(keys.length, 1, 'a widget is in marimo.widgets')

        var widget = marimo.widgets[keys[0]]

        test.ok(widget.id, 'widget has an id')
        test.done()
    },
    test_add_widgets: function(test) {
        var marimo = this.window.marimo
        var widget_args_list = [{id:'one'}, {id:'two'}]
        marimo.add_widgets(widget_args_list)

        var keys = Object.keys(marimo.widgets)

        test.equal(keys.length, widget_args_list.length, 'two widgets in list')
        test.ok(marimo.widgets.one, 'first widget found')
        test.ok(marimo.widgets.two, 'second widget found')

        test.done()
    },
    test_make_request: function(test) {
        var marimo = this.window.marimo
        var requests_made = []
        marimo.$.ajax = function(settings) {
            requests_made.push(settings)
        }
        var widget_args_list = [
            {widget_prototype:'request_widget', murl:'/some/url0'},
            {widget_prototype:'request_widget', murl:'/some/url1'},
            {widget_prototype:'request_widget', murl:'/some/url1'}
        ]
        marimo.add_widgets(widget_args_list)
        _.values(marimo.widgets).forEach(function(w){w.add_request()})

        marimo.make_request()
        test.equal(requests_made.length, 2, 'two requests were made')

        var urls_requested = _.map(requests_made, function(r){return r.url}).sort()
        var expected = ['/some/url0', '/some/url1']
        test.deepEqual(urls_requested, expected, 'requests made to right urls')

        test.done()
    },
    test_handle_response: function(test) {
        var marimo = this.window.marimo
        var widget_args_list = [
            {widget_prototype:'request_widget', murl:'/some/url0', id:'one'},
            {widget_prototype:'request_widget', murl:'/some/url1', id:'two'},
            {widget_prototype:'request_widget', murl:'/some/url1', id:'three'}
        ]
        marimo.add_widgets(widget_args_list)
        var url = '/some/url1'
        // make some dummy data to give to handle response.
        var data = [{
            id:'one',
            template:'hi {{name}}',
            context: {name:'camus'}
        }, {
            id:'two',
            template:'is the sky {{status}}?',
            context: {status:'alphabetical'}
        }]
        _.each(marimo.widgets, function(v,k,l) { v.add_request() })
        // TODO
        marimo.handle_response(url, data)
        test.equal(_.keys(marimo.requests).length, 1, 'requests got cleaned up for url1')
        var div1text = marimo.$('#one').text()
        test.equal(div1text, 'hi camus', 'html appropriate for div1')
        var div1text = marimo.$('#two').text()
        test.equal(div1text, 'is the sky alphabetical?', 'html appropriate for div2')
        test.done()
    },
    test_emit: function(test) {
        var marimo = this.window.marimo
        var event_fired = false
        marimo.$(this.window.document).bind('test_event', function() {
            event_fired = true
        })
        marimo.emit('test_event')
        test.ok(marimo.events['test_event'],true,'event firing registered')
        test.ok(event_fired, 'event was fired')
        test.done()
    },
    // should probably move this
    test_on: function(test) {
        var marimo = this.window.marimo
        marimo.add_widget({id:'one'})
        var event_caught = false
        marimo.widgets.one.on('test_on', function() {
            event_caught = true
        }, marimo.widgets.one)
        marimo.emit('test_on')
        test.ok(event_caught, 'test_on event was caught by widget')

        test.done()
    },
    test__onlist: function(test) {
        var marimo = this.window.marimo
        marimo.add_widget({id:'one'})
        var listener_triggered = false
        marimo.widgets.one.on(['event1', 'event2', 'event3'], function() {
            listener_triggered = true
        })
        marimo.emit('event1')
        test.equal(marimo.events['event1'], true, 'event1 registerd')
        test.equal(listener_triggered, false, 'listener not triggered after event1')
        marimo.emit('event2')
        test.equal(marimo.events['event2'], true, 'event2 registerd')
        test.equal(listener_triggered, false, 'listener not triggered after event2')
        marimo.emit('event3')
        test.equal(marimo.events['event3'], true, 'event3 registerd')
        test.equal(listener_triggered, true, 'listener triggered after event3')
        test.done()
    }
}

exports.wc_widget = {
    setUp: jsdomwrapper,
    test_decode: function(test) {
        var marimo = this.window.marimo
        var wcwidg = Object.create(marimo.widgetlib.writecapture_widget)
        var html = [
            '<head>',
            '<puke></puke>',
            '</head>',
            '<script>',
            '$ENDSCRIPT',
            'some junk'
        ].join('\n')
        var newhtml = wcwidg.decode(html)
        test.ok(!newhtml.match(/\$ENDSCRIPT/g), 'do not see $ENDSCRIPT')
        test.ok(newhtml.match(/<\/script>/g), 'do see </script>')

        test.done()
    },
    test_render_and_draw: function(test) {
        var marimo = this.window.marimo
        marimo.$.writeCapture = {
            sanitize: function(str) { return "WROUGHTCAUGHT" }
        }
        marimo.add_widget({
            id:'one',
            widget_prototype:'writecapture_widget',
            html: 'hi there',
            render_events:['render1', 'render2'],
            draw_events:['draw1', 'draw2']
        })
        test.equal(typeof marimo.widgets.one.safe_html, 'undefined')
        test.equal(marimo.$('#one').text(), '')
        marimo.emit('render1')
        test.equal(typeof marimo.widgets.one.safe_html, 'undefined')
        test.equal(marimo.$('#one').text(), '')
        marimo.emit('render2')
        test.equal(marimo.widgets.one.safe_html, 'WROUGHTCAUGHT')
        test.equal(marimo.$('#one').text(), '')
        marimo.emit('draw1')
        test.equal(marimo.$('#one').text(), '')
        marimo.emit('draw2')
        test.equal(marimo.$('#one').text(), 'WROUGHTCAUGHT')

        test.done()
    }
}
