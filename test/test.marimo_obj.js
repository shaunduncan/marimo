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
    test_add_widget: function(test) {
        var marimo = this.window.marimo

        var widget_args ={
            id: 'onetwothree',
            widget_prototype: 'request_widget',
            arbitrary: 'data'
        }
        marimo.add_widget(widget_args)
        var widget = marimo.widgets.onetwothree
        test.ok(widget, 'widget was created')
        test.equal(widget.data.arbitrary, 'data', 'initialization data preserved')
        test.ok(widget.data.widget_prototype !== 'base_widget', 'did not fall back to base widget')

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
    test_printf: function(test) {
        var marimo = this.window.marimo
        var formatted = marimo.printf('hello, %s. are you %s?', ['geoffery', 'jellinek'])
        test.equal('hello, geoffery. are you jellinek?', formatted, 'formatting is correct')
        test.done()
    },
    test_extend: function(test) {
        var marimo = this.window.marimo
        var obja = {
            init: function(){ return this },
            do_stuff: function(){ return 'stuff' },
            propa: 'a'
        }
        var objb = marimo.extend(obja, {
            b_stuff: function b_stuff() { return 'bstuff' },
            propb: 'b'
        })
        test.ok(objb, 'object returned')
        test.equal(objb.propa, 'a', 'can get to obja stuff')
        test.equal(objb.propb, 'b', 'can get to new prop')
        test.equal(objb.b_stuff.name, 'b_stuff', 'function name preserved')

        test.done()
    }
    // not testing random_int.
}
