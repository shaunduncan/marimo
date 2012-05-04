var jsdom_wrapper = require('./test.common.js').jsdom_wrapper

exports.test_jsdom_bootstrap = {
    setUp: jsdom_wrapper(),
    test_dom_sanity: function(test) {
        var $ = this.window.$
        test.ok(this.window, 'window exists')
        test.ok(this.window.marimo, 'marimo exists')
        test.ok($, 'window.$ exists')
        test.equal($('#one').length, 1, 'found a div')
        test.done()
    }
}
