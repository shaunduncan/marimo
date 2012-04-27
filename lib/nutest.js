var jsdom = require('jsdom')

setTimeout = function(fun) { fun(); }

function jsdomwrapper(cb) {
    var testcase = this
    jsdom.env('<html><head></head><body><div id="1"></div><div id="2"></div></body>',
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
        test.equal($('#1').length, 1, 'found a div')
        test.done()
    },
    test_add_widget: function(test) {
        test.done()
    },
    test_add_widgets: function(test) {
        test.done()
    },
    test_make_request: function(test) {
        test.done()
    },
    test_handle_response: function(test) {
        test.done()
    },
    test_emit: function(test) {
        test.done()
    },
    test_on: function(test) {
        test.done()
    },
    test__onlist: function(test) {
        test.done()
    }
}

exports.wc_widget = {
    setUp: jsdomwrapper,
    test_decode: function(test) {
        test.done()
    },
    test_render_and_draw: function(test) {
        test.done()
    }
}
