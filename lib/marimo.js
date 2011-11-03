// # marimo is a library for self-aware, self-updating, and self-rendering HTML widgets.
// it provides a variety of javascript objects that can ask for data and
// intelligently render themselves. These widgets are intended to be extended
// by application developers. Marimo is being developed at Cox Media Group
// Digital for rendering advertisements, comment threads, and various
// "real-time" widgets such as weather reports and radio "now playing"
// displays  Our hope is to provide a generic framework to replace the many
// one-off ajax->backend view hacks that tend to grow on modern web
// applications.


// polyfill for Object.create, sadly
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
    };
}

// polyfill for console
if (!console) {
    console = {
        log: function() {},
        info: function() {},
        error: function() {}
    };
}

// ## namespace / object
// this namespace stores the general marimo state (widget requests, live
// widgets, an event registry), acts as an event transport for widgets, and
// houses "widgetlib," a collection of widgets that can either be used ori
// differentially inherited from.
var marimo = {
    // batch request objects that widgets use to get fresh data about themselves
    requests: {},
    // live widgets on the page
    widgets: {},
    // an event registry for tracking events that have occurred
    events: {},
    // ### init
    // this is an idiom you will see throughout marimo. `init` is kind of like
    // a constructor, but don't think about it that way. it is used to set up
    // some kind of runtime state for an object. in this case, it's used to set
    // a js lib object (probably jQuery, but also possibly Ender or xuijs)
    // #### note
    // currently $ is assumed to have the following interface:
    // $(), $.ajax(settings), $().bind(), $().trigger(), $(function() {}).
    // this is obviously just jquery.
    init: function init($) {
        this.$ = $;
        // **TODO** write an adaptor that maps from {jquery,xuijs,etc} to a generic $ object
        return this;
    },
    // given data about a widget that should exist, create it and add it to
    // `this.widgets`
    add_widget: function add_widget(widget_args) {
       var widget_prototype = this.widgetlib[widget_args['widget_prototype']];
       if (!widget_prototype) {
           if (widget_args['widget_prototype']) {
             console.log('Could not find widget_protoype: ' + widget_args['widget_prototype'] + ', falling back to base_widget');
           }
           widget_prototype = this.widgetlib.base_widget;
       }
       var w = Object.create(widget_prototype);
       this.widgets[widget_args.id] = w;
       this.widgets[widget_args.id].init(widget_args);
    },
    // a simple wrapper around `this.add_widget()`
    add_widgets: function add_widgets(widgets) {
        for (var key in widgets) {
            if (!widgets.hasOwnProperty(key)){return;}
            this.add_widget(widgets[key]);
        }
    },
    // ### make_request
    // this is a bulk method for having all curent batch requests
    // (in `this.requests`) make their AJAX calls. It sets up
    // `this.handle_response()` to deal with the returned JSON.
    make_request: function make_request() {
        for (var key in this.requests) {
            if (!this.requests.hasOwnProperty(key)) { return; }
            var batch = this.requests[key];
            var that = this;
            batch.make_request(function(url, data) { that.handle_response(url, data) });
        }
    },
    // dole out new widget data to widgets. uses `widget.id` to find and
    // deliver data.
    handle_response: function handle_response(url, data) {
        delete this.requests[url];
        for (var datum in data) {
            if (!data.hasOwnProperty(datum)) {return}
            var widget_data = data[datum];
            this.widgets[widget_data.id].update(widget_data);
        }
    },
    emit: function emit(evnt) {
        this.events[evnt] = true;
        this.$(document).trigger(evnt);
    }
};

// ## batch_request
// this object represents a single URL from which some number of widgets will
// request templates and template context. It is here to synchronize and bulk
// multiple requests to the same endpoint.
marimo.batch_request = {
    init: function init(url) {
        this.payloads = [];
        this.url = url;
        return this;
    },
    add: function add(payload) {
        // **TODO** make more resilient/less trusting in the face of corrupted ids etc
        this.payloads.push(payload);
    },
    make_request: function make_request(cb) {
       var that = this;
       // **TODO** retries? better error callback?
       marimo.$.ajax({
         url: this.url,
         data: {bulk:JSON.stringify(this.payloads)},
         dataType: 'json',
         success: function(data) { cb(that.url, data); },
         error: function() {
           console.log('error processing bulk request '+that.url+' with json '+JSON.stringify(that.payloads));
         }
       });
    }
};

// ## the widgetlib
// widgetlib holds raw objects that can be used with Object.create().
marimo.widgetlib = {};

// ### base_widget
// this is a base widget that knows nothing about requests. you probably should
// only be inheriting from it.
marimo.widgetlib.base_widget = {
    init: function(data) {
        this.id = data.id;
        this.data = data;
        return this;
    },
    // no-op
    update: function(data) { },
    // no-op
    render: function() { },
    // set up an event listener. such events will be later emitted by marimo.
    // check to see if designated event has already been emitted so we can fire
    // synchronously. Optionally pass a list of events; once all of them have
    // been fired the callback will be run.
    on: function(evnt, cb) {
        if (typeof evnt === 'object' && typeof evnt.length !== 'undefined') {
            this.onlist(evnt, cb);
            return;
        }
        if (marimo.events[evnt]) {
             cb.call(this);
             return;
        }
        marimo.$(document).bind(evnt, function() { cb.call(this); })
    },
    // wait on multiple events to do something
    onlist: function(evntlist, cb) {
        if (evntlist.length > 0) {
            var evnt = evntlist.pop();
            var that = this;
            this.on(evnt, function() { that.onlist.call(that, evntlist, cb);});
        }
        else {
            cb();
        };
    }
};

// ### request_widget
// this is a requestful widget that uses network calls to get templates/info to
// render. it funnels requests through batch_request objects.
marimo.widgetlib.request_widget = Object.create(marimo.widgetlib.base_widget);
marimo.widgetlib.request_widget.init = function(data) {
    this.id = data.id;
    this.murl = data.murl;
    this.data = data;
    this.add_request();
    return this;
};
// this is a separate method so it can be called repeatedly. we're not doing
// that yet.
marimo.widgetlib.request_widget.add_request = function add_request() {
    if (!marimo.requests[this.murl]) {
        marimo.requests[this.murl] = Object.create(marimo.batch_request).init(this.murl);
    }
    marimo.requests[this.murl].add(this.data);
};
marimo.widgetlib.request_widget.update = function(data) {
    // merge data with this's
    for (var key in data) {
        if (!data.hasOwnProperty(key)) { return; }
        this.data[key] = data[key];
    }
    // this will do more interesting things in the future.
    this.render();
};
marimo.widgetlib.request_widget.render = function() {
    // **TODO** support a template_url (distinct from data api)
    // **TODO** make not-mustache-specific
    var html = Mustache.to_html(this.data.template, this.data.context);

    var that = this;
    marimo.$(function() {
        // Actually modify the DOM. note that this is the only time we care about onready.
        // **TODO** could instead use this.id+'_ready' event like writecapture_widget
        marimo.$('#'+that.id).html(html);
    });
};

// ### writecapture_widget
// a widget for handling html with potentially horrible javascript. note
// that this is not requestful.
marimo.widgetlib.writecapture_widget = Object.create(marimo.widgetlib.base_widget);
marimo.widgetlib.writecapture_widget.init = function init(data) {
    // **TODO** should this hard-inherit from base_widget here? prob not?
    var that = marimo.widgetlib.base_widget.init.call(this, data);
    this.render_events = (data.render_events || []);
    // by default will wait for it's own div to be drawn if you
    // change this you'll probably want to wait for this too
    this.draw_events = (data.draw_events || [this.id + '_ready']);
    setTimeout(function() { that.render.call(that) }, 1);
    return that;
}
// TODO factor repetition here
marimo.widgetlib.writecapture_widget.render = function render() {
    if (this.render_events.length > 0) {
        var evnt = this.render_events.pop();
        var that = this;
        this.on(evnt, function() { that.render.call(that) });
    }
    else {
        console.log('rendering: ' + this.id);
        this.safe_html = marimo.$.writeCapture.sanitize(this.decode(this.data.html));
        this.draw();
    }
};
marimo.widgetlib.writecapture_widget.draw = function draw() {
    if (this.draw_events.length > 0) {
        var evnt = this.draw_events.pop();
        var that = this;
        this.on(evnt, function() { that.draw.call(that); });
    }
    else {
        marimo.$('#'+this.id).html(this.safe_html);
    }
};
// yeah this hurts. this is for html that is in JSON that is staticly put on
// pages (like, oh, say, for ads). browsers will pick up on the </script> and
// blow up.
marimo.widgetlib.writecapture_widget.decode = function decode(html) {
    return html.replace(/\$ENDSCRIPT/g, "</script>").replace(/\$NEWLINE/g, '\n');
}

// ### onready_widget
// a writecapture widget that waits for doc.ready to render
marimo.widgetlib.onready_widget = Object.create(marimo.widgetlib.writecapture_widget);
marimo.widgetlib.onready_widget.render = function render() {
    var that = this;
    marimo.$(function() {
        marimo.widgetlib.writecapture_widget.render.call(that);
    });
};

// **TODO** websocket widget
// **TODO** don't assume jquery
// **TODO** don't assume JSON
// **TODO** roll writecapture and mustache into our generalized $
// **TODO** fix indentation
