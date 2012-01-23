# marimo
## smart widgets

marimo is a library for self-aware, nonblocking, and interactive
javascript widgets. It strives to leave as much as possible to the
application developer and to be more of a starting point for
customized widgets that fulfill specifc needs. It is not a
kitchen-sink library nor a UI library: it's more of a toolset.

marimo is still evolving. it's currently used in big ways in production at Cox
Media Group and what you see in the github repo is what we use in prod.
However, the API is still stabilizing and growing and as such marimo should be
considered a WIP.

### example

    var my_twitter_widget = marimo.extend(marimo.widgetlib.request_widget, {
        transform: function (data) {
            return { context: { tweets: data } }
        }
    }
    marimo.add_widget({
        id: 'tweets',
        murl: 'http://some.api/twitter/public',
        template: '<ul>{{#tweets}}<li>{{text}}</li>{{/tweets}}</ul'
    })
    var tweets = marimo.widgets.tweets
    tweets.make_request()

### default widgets

marimo provides three widgets that you can use or extend:

* base\_widget
        the mother widget. all widgets extend from here.
* request\_widget
        a widget that asks for data from a server and renders it with a
        mustache template
* writecapture\_widget
        a widget that accepts dirty, third party html and sanitizes it so it
        can be rendered in a nonblocking fashion

these objects all exist in marimo.widgetlib.

to extend a widget, we use marimo.extend(). this is a wrapper around Object.create() with a few niceties.

    var my_new_widget = marimo.extend(marimo.widgetlib.base_widget, {
        // here, put new methods or method overrides.
        // your anonymous functions will be named using their key in this
        // object.
    })

### inter-widget communication

widgets are designed to talk to each other. There are two ways to accomplish
this. First, any widget can introspect marimo.widgets on a running page to see what
widgets are live. Introspection of those widgets is encouraged. Second, marimo
provides a simple event transport for widgets to use. base\_widget provides
.on() and .emit() to all widgets to work with events. marimo.events contains a
registry of all events that have fired up to that point for all widgets.

### backends for request\_widgets

request\_widgets can either take properly formatted json in this form:

    {
        template: "<somehtml>",
        context: {
            // context passed to Mustache to render template
        }
    }

or accept arbitrary data. define a transform method in an extended request
widget to massage incoming json (see the twitter example above).

### meta

marimo was written by Nathaniel Smith and Alex Dreyer for Cox Media Group
Digital & Strategy. It is licensed under the terms of the MIT license.

### contributors

manny blum
calvin spealman
rob combs
cliff hayashida
