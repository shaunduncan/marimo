// Object polyfills are from mozilla dev network
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.')
        }
        function F() {}
        F.prototype = o
        return new F()
    }
}
if(!Object.keys) Object.keys = function(o){
    if (o !== Object(o))
        throw new TypeError('Object.keys called on non-object')
    var ret=[],p
    for(p in o) if(Object.prototype.hasOwnProperty.call(o,p)) ret.push(p)
    return ret
}

// "polyfill" for console
if (!window.console) {
    window.console = {
        log: function() {},
        info: function() {},
        error: function() {}
    }
}

var marimo = {
    /* this namespace stores the general marimo state (widget requests, live
       widgets, an event registry), acts as an event transport for widgets, and
       houses "widgetlib," a collection of widgets that can either be used or
       extended.
    */
    // batch request objects that widgets use to get fresh data about themselves
    requests: {},
    // live widgets on the page
    widgets: {},
    // an event registry for tracking events that have occurred
    events: {},
    init: function init($) {
        /*  initialize marimo with some framework object. You must do this.
            Currently only jQuery is supported (sorry).
        */
        // TODO eliminate dependence on jQuery
        this.$ = $

        this.$(document).ready(function() { marimo.emit('documentready') })

        return this
    },
    add_widget: function add_widget(widget_args) {
        /*  add a widget to marimo.widgets. widget_args is an object that
            contains data that will be fed to the resulting widget's .init().
            marimo will look for widget_prototype is a string that corresponds
            to an object in marimo.widgetlib. If this key does not exist marimo
            will fall back to base_widget (this is probably not what you want).
        */
        var widget_prototype = this.widgetlib[widget_args['widget_prototype']]
        if (!widget_prototype) {
            if (widget_args['widget_prototype']) {
              console.log('Could not find widget_protoype: ' + widget_args['widget_prototype'] + ', falling back to base_widget')
            }
            widget_prototype = this.widgetlib.base_widget
        }
        if (!widget_args.id) { widget_args.id = this.random_int() }
        var w = Object.create(widget_prototype)
        this.widgets[widget_args.id] = w
        this.widgets[widget_args.id].init(widget_args)
    },
    add_widgets: function add_widgets(widgets) {
        /* a simple wrapper around this.add_widget() */
        for (var key in widgets) {
            if (!widgets.hasOwnProperty(key)) continue
            this.add_widget(widgets[key])
        }
    },
    make_request: function make_request() {
        /* tell all the batched requests in this.requests to make their
           requests to their murls.

           This method will do nothing if there is nothing in this.requests.
        */
        for (var key in this.requests) {
            if (!this.requests.hasOwnProperty(key)) continue
            var batch = this.requests[key]
            var that = this
            batch.make_request(function(url, data) { that.handle_response(url, data) })
        }
    },
    handle_response: function handle_response(url, data) {
        /* handle a bulked response to this.make_request. use the id property
           in each response object to route the data.
        */
        delete this.requests[url]
        for (var datum in data) {
            if (!data.hasOwnProperty(datum)) continue
            var widget_data = data[datum]
            this.widgets[widget_data.id].update(widget_data)
            this.widgets[widget_data.id].render()
        }
    },
    emit: function emit(evnt) {
        /* emit an event into the marimo event pool for widgets to hear */
        this.events[evnt] = true
        this.$(document).trigger(evnt)
    },
    printf: function printf(str, args) {
        /* purely a convenience function.

           var formatted = marimo.printf('hello there %s are you %s', ['nate', 'blue'])
        */
        marimo.$.each(args, function(k, v) {
            str = str.replace('%s', v)
        })
        return str
    },
    extend: function extend(obj, ex) {
        /* given some existing object, clone it with Object.create() and add
           the new behavior described by the ex object.

           the new object is returned.

           var mywidget = marimo.extend(marimo.widgetlib.base_widget, {
               thing: function() { do_stuff() },
               ...
           }

           functions in the new object will have their names set appropriately
           using their key in the ex object.
        */
        var new_obj = Object.create(obj)
        for (var key in ex) {
            if (!ex.hasOwnProperty(key)) continue
            var val = ex[key]
            new_obj[key] = val
            if (typeof(val) === 'function') new_obj[key].name = key
        }
        return new_obj
    },
    random_int: function random_int(min, max) {
        min = min || 0
        max = max || 10000
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

marimo.batch_request = {
    /* an object for representing a single url and the requests that will go to
       that url.
    */
    init: function init(url) {
        /* initialize this batch request with some endpoint URL */
        this.payloads = []
        if (!url) {
            console.error('batch_request needs a url')
            return
        }
        this.url = url
        return this
    },
    add: function add(payload) {
        /* add a widget's request data to our yet-to-be-transferred payloads */
        if (!payload || typeof payload !== 'object') {
            console.error('batch_request got a strange payload:')
            console.error(payload)
            return
        }
        this.payloads.push(payload)
    },
    make_request: function make_request(cb) {
        var self = this
        // TODO implement retries
        marimo.$.ajax({
            url: this.url,
            data: {bulk:JSON.stringify(this.payloads)},
            dataType: 'json',
            success: function(data) { cb(self.url, data) },
            error: function() {
                var msg = marimo.printf('bulk request to %s failed with json %s', [self.url, JSON.stringify(self.payloads)])
                console.error(msg)
            }
        })
    }
}

// widgetlib holds raw objects that can be used with Object.create().
marimo.widgetlib = {}

marimo.widgetlib.base_widget = {
    /* this widget doesn't do much. It is here to be extended. */
    init: function(data) {
        /* basic init function for widgets. sets this.id and the rest of the
           argument object to this.data
        */
        this.id = data.id
        this.data = data
        return this
    },
    update: function(data) {
        /* to be implemented */
    },
    render: function() {
        /* to be implemented */
    },
    // set up an event listener. such events will be later emitted by marimo.
    // check to see if designated event has already been emitted so we can fire
    // synchronously. Optionally pass a list of events; once all of them have
    // been fired the callback will be run.
    on: function(evnt, cb, context) {
        /* call cb given event evnt. Optionally pass a context for cb to be
           called within. context defaults to the current context.

           evnt can either be a string or an array. If it is an array, cb will
           be called once every event named in the array has fired.
        */
        if (!context) context = this

        var wrapped_cb = function(){cb.apply(context,Array.prototype.slice.call(arguments))}
        if (typeof evnt === 'object' && typeof evnt.length !== 'undefined') {
            context._onlist.call(context, evnt, wrapped_cb)
            return
        }
        if (marimo.events[evnt]) {
             wrapped_cb()
             return
        }
        marimo.$(document).bind(evnt, function() { wrapped_cb() })
    },
    emit: function(evnt) {
        /* emit an event into marimo's event pool this is a wrapper around
           marimo.event for now.
        */
        marimo.emit(evnt)
    },
    _onlist: function(evntlist, cb) {
        /* wait on multiple events to do something. this is NOT intended to be
           called. so don't call it. use .on(), and pass
           an array instead of a string. you've been warned.
        */
        if (evntlist.length > 0) {
            var evnt = evntlist.pop()
            var that = this
            this.on(evnt, function() { that._onlist(evntlist, cb)}, this)
        }
        else {
            cb()
        }
    },
    // map DOM events to selectors and functions
    domwire: function wire(mapping) {
        /* map DOM events to selectors and functions. This is essentially a 
           large wrapper around calls to marimo.$(selector).bind(event, cb)

           this.domwire([{
               selector: marimo.printf('#%s button:first', [this.id]),
               event: 'click',
               cb: this.make_request
           }, {
               selector: marimo.printf('#%s form', [this.id]),
               event: 'submit',
               cb: this.submit_form
           }])
        */
        var widget = this
        marimo.$.each(mapping, function(k,v) {
            marimo.$(v.selector).bind(v.event, function(e) {
                e.preventDefault()
                v.cb.call(widget, e)
            })
        })
    }
}

// ### request_widget
// this is a requestful widget that uses network calls to get templates/info to
// render. it funnels requests through batch_request objects.
marimo.widgetlib.request_widget = marimo.extend(marimo.widgetlib.base_widget, {
    /* a widget that asks for data and, optionally, a mustache template from
       some url endpoint.
    */
    init: function (data) {
        /* initialize this widget with an id and murl. the data object argument
           will be assigned to this.data (as in base_widget).
        */
        this.id = data.id
        this.murl = data.murl
        this.data = data

        if (!this.data.template) {
            // if we received no template, try and find one in the DOM.
            var template = marimo.$('#'+this.id).html()
            if (template) {
                this.data.template = template
                marimo.$('#'+this.id).html('').show()
            }
        }

        return this
    },
    add_request: function (options) {
        /* submit a request to be batched and bulked by marimo using a
           batch_request. No requests will be made until a call to
           marimo.make_request.
        */
        options = options || {}
        var request_data = {
            id: this.data.id,
            args: this.data.args,
            kwargs: this.data.kwargs,
            widget_handler: this.data.widget_handler || this.data.widget_name
        }
        if (options.cache_bust) {
            request_data.__cache_bust = String(Math.random()).substr(3,5)
        }
        if (!marimo.requests[this.murl]) {
            marimo.requests[this.murl] = Object.create(marimo.batch_request).init(this.murl)
        }
        marimo.requests[this.murl].add(request_data)
    },
    make_request: function () {
        /* make a one off request to this widget's murl. upon a successful
           response, the update and render methods of this widget are called.
           an error will call this.handle_ajax_error.
        */
        var kwargs = JSON.stringify(this.kwargs || this.data.kwargs)
        var args = JSON.stringify(this.args || this.data.args)
        marimo.$.ajax({
            url: this.murl,
            type: 'GET',
            data: {
              widget_handler:this.data.widget_handler,
              kwargs:kwargs,
              args:args
            },
            dataType:'json',
            context:this,
            success: function (data) {
                this.update(data)
                this.render()
            },
            error: this.handle_ajax_error
        })
    },
    transform: function (data) {
        /* optionally mutate data into a form consumable by this.data.template.
           transform will be called before any invocation of
           update. Override in clones; this version is just a passthrough that
           returns data.

           Your most frequent use case will be to turn data into something that
           looks like this (given, say, the response from twitter's public
           timeline API):

           {
               context: {tweets: data}
           }

           the context property of this.data is what is used to render
           this.data.template.
        */
        return data
    },
    update: function (data) {
        /* given some new widget data update this.data, overriding as
           necessary. this is called automatically by .make_request() and in
           turn calls .transform(data).
        */
        if (this.transform) data = this.transform(data)
        for (var key in data) {
            if (!data.hasOwnProperty(key)) continue
            this.data[key] = data[key]
        }
    },
    render: function () {
        /* combine this.data.context with this.data.template. Currently this
           relies on Mustache. HTML will be painted to the DOM on the page's
           onload event.

           This will be split out into render and draw phases like
           writecapture_widget. It will also use render_events and draw_events
           in the same way instead of relying on onload.
        */
        // TODO split this into render, draw methods attentive to render_events and draw_events
        // TODO support a template_url (distinct from data api)
        // TODO make not-mustache-specific
        var html = Mustache.to_html(this.data.template, this.data.context)

        var that = this
        marimo.$(function() {
            marimo.$('#'+that.id).html(html).show()
        })
    },
    handle_ajax_error: function(data) {
        /* basic handler for ajax requests made by .make_request().
           simply uses console.error.
        */
        var status = data.status
        try {
            var msg = JSON.parse(data.response).error
            console.error(marimo.printf('%s: %s', [status, msg]))
            return {status:status, msg:msg}
        } catch (e) {
            // don't want to error out of our error handler, so use bare
            // try/catch
            console.error(data)
        }
    }
})

marimo.widgetlib.writecapture_widget = marimo.extend(marimo.widgetlib.base_widget, {
    /* a widget for handling html with potentially horrible javascript.
       sandboxes, sanitizes, and background-renders the html provided in
       .init().
    */
    default_render_events: [],
    init: function (data) {
        marimo.widgetlib.base_widget.init.call(this, data)
        this.render_events = this.default_render_events.concat((data.render_events || []))
        this.draw_events = (data.draw_events || [this.id+'_ready'])
        this.wc_compatibility_mode = false
        if (typeof data.wc_compatibility_mode !== 'undefined') {
            this.wc_compatibility_mode = data.wc_compatibility_mode
        }

        var self = this
        setTimeout(function() { self.render.call(self) }, 1)

        return this
    },
    render: function () {
        /* prepare this.data.html. waits until all events in this.render_events
           have fired.
        */
        var options = {writeOnGetElementById:this.wc_compatibility_mode}
        this.on(this.render_events, function() {
            this.safe_html = marimo.$.writeCapture.sanitize(this.decode(this.data.html), options)
            this.draw()
        }, this)
    },
    draw: function () {
        /* actually write sanitized html out into the DOM. waits until all
           events in this.draw_events have fired.
        */
        this.on(this.draw_events, function() {
            marimo.$('#'+this.id).html(this.safe_html)
        }, this)
    },
    decode: function (html) {
        /* this utterly painful method decodes an html hunk with script tags
           and newlines escaped.
        */
        return html.replace(/\$ENDSCRIPT/g, "</script>").replace(/\$NEWLINE/g, '\n')
    }
})
