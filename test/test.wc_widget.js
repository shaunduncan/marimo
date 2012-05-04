var jsdom_wrapper = require('./util.test.js').jsdom_wrapper

exports.test_wc_widget = {
    setUp: jsdom_wrapper(),
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
