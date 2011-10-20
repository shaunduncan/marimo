marimo Javascript API
=====================

The power of marimo is its javascript API. It is housed in the marimo object in
marimo.js.  it provides a variety of javascript objects (the widget library, or
marimo.widgetlib) that can ask for data and intelligently render themselves.
These widgets are intended to be extended by application developers and can be
used for rendering advertisements, comment threads, and various "real-time"
widgets such as weather reports and radio "now playing" displays. Marimo is intended to 
provide a generic framework to replace the many one-off ajax->backend view hacks
that tend to grow on modern web applications.

To write your own marimo widgets extend the widget base class. Marimo eschews
the "new" keyword in favor of prototypal / differential inheritence, so you'll
want to use Object.create. marimo.js will polyfill this method if your
execution environment lacks it (eg, IE < 9).

.. code-block:: javascript

    var my_widget = Object.create(marimo.widgetlib.request_widget);
    my_widget.update = function(data) {
        // handle a data update from a server
    };
    my_widget.render = function() {
        // render some html, maybe with a template
    };
    // define helper functions, etc, as needed


For example, you might want to inherit from the write_capture widget into a
generic ad widget with rendering rules specific to your site. You could further
inherit from your ad_widget to, say, support particularly pesky ads.

The widgets in marimo.widgetlib are meant to be read and used as examples for
building your own widgets.
