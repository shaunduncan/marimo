// TODO don't assume jquery
// TODO don't assume JSON
// TODO fix indentation

// this is a base widget that knows nothing about requests
var widget = {
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
var request_widget = Object.create(widget);{
request_widget.init = function(data) {
    this.id = data.id;
    this.data = data;
    return this;
};
request_widget.update = function(data) {
    // merge data with this's
    for (var key in data) {
        if (!data.hasOwnProperty(key)) { return; }
        this.data[key] = data;
    }
    this.render();
    // TODO future excitement
};
request_widget.render = function() {
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

function BatchRequest(url) {
    this.payloads = [];
    this.url = url;
};

BatchRequest.prototype.add = function(payload) {
    // TODO make more resilient/less trusting in the face of corrupted ids etc
    this.payloads.push(payload);
};

BatchRequest.prototype.make_request = function(cb) {
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
};


function Marimo($) {
    this.requests = {};
    this.widgets = {};
    this.widgets_in = 0;
    this.events ={};
    this.$ = $;
}

Marimo.prototype.add_widget = function(widget_args) {
   var widget_prototype = window[widget_args['widget_prototype']];
   console.log('TRYING TO ADD WIDGET WITH ID '+ widget_args['id']);
   console.log('GOT WIDGET_PROTOTYPE: ' + widget_args['widget_prototype']);
   if (!widget_prototype) {
       widget_prototype = widget;
   }
   var w = Object.create(widget_prototype);
   this.widgets[widget_args.id] = w;
   this.widgets[widget_args.id].init(widget_args);
};

Marimo.prototype.add_widgets = function(widgets) {
    console.log(widgets);
    for (var key in widgets) {
        if (!widgets.hasOwnProperty(key)){return;}
        this.add_widget(widgets[key]);
    }
};

Marimo.prototype.make_request = function() {
    if (this.widgets_in > 0) {
        var that = this;
        setTimeout(function() { that.make_request() }, 1);
        return;
    }
    for (var key in this.requests) {
        if (!this.requests.hasOwnProperty(key)) { return; }
        var batch = this.requests[key];
        var that = this;
        batch.make_request(function(url, data) { that.handle_response(url, data) });
    }
};

Marimo.prototype.handle_response = function(url, data) {
    delete this.requests[url];
    for (var datum in data) {
        if (!data.hasOwnProperty(datum)) {return}
        var widget_data = data[datum];
        this.widgets[widget_data.id].update(widget_data);
    }
    // tell widgets to update based on what is in data.
};

Marimo.prototype.fire = function(evnt) {
    this.events[evnt] = true;
    this.$(document).trigger(evnt);
};

var marimo = new Marimo();
