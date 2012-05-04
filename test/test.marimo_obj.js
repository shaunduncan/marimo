var jsdom_wrapper = require('./util.test.js').jsdom_wrapper

setTimeout = function(fun) { fun(); }

exports.test_marimo_obj = {
    setUp: jsdom_wrapper(),
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
}
