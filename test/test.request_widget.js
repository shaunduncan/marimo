var jsdom_wrapper = require('./util.test.js').jsdom_wrapper
var _ = require('underscore')

setTimeout = function(fun) { fun(); }

/*
    Tests both the widget itself and the BatchRequest framework.
*/

exports.test_request_widget = {
    setUp: jsdom_wrapper(),
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
    }
}
