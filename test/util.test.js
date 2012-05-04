var jsdom = require('jsdom')

exports.jsdom_wrapper = function(html) {
    html = html || '<html><head></head><body><div id="one"></div><div id="two"></div></body>'
    return function(cb) {
        var testcase = this
        jsdom.env(html,
            [
                '../lib/jquery-1.6.4.js',
                '../lib/mustache.js',
                '../lib/marimo.js'
            ], function(err, window) {
                window.$.ajax = function(url, settings) {
                    var success = settings.success
                    var error = settings.error
                    var data = this.data ? this.data : {}
                    if (this.should_fail) {
                        error(data)
                    }
                    else {
                        success(data)
                    }
                }
                window.marimo.init(window.$)

                testcase.window = window

                cb()
            }
        )
    }
}
