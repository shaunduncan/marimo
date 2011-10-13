// TODO don't assume jquery
// TODO don't assume JSON
// TODO fix indentation

// namespace
// stores marimo state, acts as event broker for widgets,
var marimo = {
    requests: {},
    widgets: {},
    events: {},
    init: function init($) {
        this.$ = $;
        return this;
    },
    add_widget: function add_widget(widget_args) {
       var widget_prototype = this.widgetlib[widget_args['widget_prototype']];
       console.log('TRYING TO ADD WIDGET WITH ID '+ widget_args['id']);
       console.log('GOT WIDGET_PROTOTYPE: ' + widget_args['widget_prototype']);
       if (!widget_prototype) {
           widget_prototype = this.widgetlib.base_widget;
       }
       var w = Object.create(widget_prototype);
       this.widgets[widget_args.id] = w;
       this.widgets[widget_args.id].init(widget_args);
    },
    add_widgets: function add_widgets(widgets) {
        console.log(widgets);
        for (var key in widgets) {
            if (!widgets.hasOwnProperty(key)){return;}
            this.add_widget(widgets[key]);
        }
    },
    make_request: function make_request() {
        for (var key in this.requests) {
            if (!this.requests.hasOwnProperty(key)) { return; }
            var batch = this.requests[key];
            var that = this;
            batch.make_request(function(url, data) { that.handle_response(url, data) });
        }
    },
    handle_response: function handle_response(url, data) {
        delete this.requests[url];
        for (var datum in data) {
            if (!data.hasOwnProperty(datum)) {return}
            var widget_data = data[datum];
            this.widgets[widget_data.id].update(widget_data);
        }
        // tell widgets to update based on what is in data.
    },
    emit: function emit(evnt) {
        this.events[evnt] = true;
        this.$(document).trigger(evnt);
    }
};

marimo.batch_request = {
    payloads: [],
    init: function init(url) {
        this.url = url;
        return this;
    },
    add: function add(payload) {
        // TODO make more resilient/less trusting in the face of corrupted ids etc
        this.payloads.push(payload);
    },
    make_request: function make_request(cb) {
       var that = this;
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

marimo.widgetlib = {};

// this is a base widget that knows nothing about requests
marimo.widgetlib.base_widget = {
    init: function(data) {
        this.id = data.id;
        this.data = data;
        return this;
    },
    update: function(data) { },
    render: function() { },
    on: function(evnt, cb) {
        if (marimo.events[evnt]) {
             cb.call(this);
             return;
        }
        marimo.$(document).bind(evnt, function() { cb.call(this); })
    }
};

// this is a requestful widget that uses network calls to get templates/info to render
marimo.widgetlib.request_widget = Object.create(marimo.widgetlib.base_widget);
marimo.widgetlib.request_widget.init = function(data) {
    this.id = data.id;
    this.url = data.url;
    this.data = data;
    this.add_request();
    return this;
};
marimo.widgetlib.request_widget.add_request = function add_request() {
    if (!marimo.requests[this.url]) {
        marimo.requests[this.url] = Object.create(marimo.batch_widget).init(this.url);
    }
    marimo.requests[this.url].add(this.data);
};
marimo.widgetlib.request_widget.update = function(data) {
    // merge data with this's
    for (var key in data) {
        if (!data.hasOwnProperty(key)) { return; }
        this.data[key] = data;
    }
    this.render();
    // TODO future excitement
};
marimo.widgetlib.request_widget.render = function() {
    // TODO support a template_url
    // TODO make not-mustache-specific
    var html = Mustache.to_html(this.data.template, this.data.context);

    var that = this;
    marimo.$(function() {
        // Actually modify the DOM. note that this is the only time we care about onready.
        marimo.$('#'+that.id).html(html);
    });
};

// TODO websocket widget
