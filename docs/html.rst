Example of an HTML page using Marimo widgets
============================================

For marimo widgets to work marimo needs to be included and set up in the page.
Once it is set up the widgets must be registered with marimo. When the widgets
are added their init method will be called  This should be responsible for
asking for data, rendering templates, and doing whatever else from this point
on the widget needs to do to be useful. The div where the widget should render
itself should have the unique id for that widget which is up to the developer
to choose. ::

    <html>
    <head>
        <!-- for now, jquery and mustache are required. include as necessary -->
        <script src="marimo.js"></script>
        <script>
            marimo.add_widget({
                id:'example_widget2',
                widget_prototype:'writecapture_widget',
                template:'<script>document.write("i'm a bad ad")$ENDSCRIPT'
            });
        </script>
    </head>
    <body>
        <h1>my page</h1>
        <div id="example_widget1"></div>
        <script>
            marimo.add_widget({
                id: 'example_widget1',
                widget_prototype:'request_widget',
                args: ['arg1'],
                kwargs: {}
            });
        </script>
        <p>hey there</p>
        <div id="example_widget2"></div>
        <script>marimo.emit('example_widget2_ready');</script>
    </body>
    </html>

Marimo has an event system developers can use to alert widgets to the DOM being
in an appropriate state. For example, see how example_widget2 has a
<script> tag that announces when the <div> it will render to is rendered. The
widget object we created for example_widget2 in <head> will listen for this
event and render as soon as it catches it.

Also note the use of the hideous $ENDSCRIPT sigil. Browsers will see </script>
in javascript strings and parse it as an actual closing tag. The writecapture
widget knows to replace that sigil.

Why do all this? the writecapture_widget can take the html you feed it and take
care of all the writecapture processing necessary while the DOM is rendering.
When it's time to actually put the finished writecapture output on the page,
the widget will check to make sure its <div> exists before trying to paint.
