// TODO don't assume jquery
// TODO don't assume JSON
// TODO fix indentation
var widget = {
    init: function(data) {
        this.id = data.id;
        // TODO write
        this.args = data;
        this.data = {};
        return this;
    },
    update: function(data) {
        // merge data with this's
        // TODO make this proper update, for now overwrite
        this.data = data;
        this.render();
        // TODO future excitement
    },
    render: function() {
        var that = this;
        // TODO support a template_url
        // TODO make not-mustache-specific
        var html = Mustache.to_html(that.data.template, that.data.context);
        marimo.$(function() {
            // Actually modify the DOM. note that this is the only time we care about onready.
            marimo.$('#'+that.id).html(html);
        });
    }
};

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
    this.$ = $;
}

Marimo.prototype.add_widget = function(widget_args) {
    // TODO lock request objs while they are making a request
    this.widgets_in++;
    var that = this;
    setTimeout(function() {
        var url = widget_args.murl;
        if (!that.requests[url]) {
            that.requests[url] = new BatchRequest(url);
        }
        that.requests[url].add(widget_args);
        // TODO please fucking namespace marimo shit for the love of god
        var widget_prototype = window[widget_args['widget_prototype']];
        if (!widget_prototype) {
            widget_prototype = widget;
        }
        // TODO delete constructor arg from widget_args?
        var w = Object.create(widget_prototype).init(widget_args);
        that.widgets[w.id] = w;
        that.widgets_in--;
   }, 1);
};

Marimo.prototype.add_widgets = function(widgets) {
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

var marimo = new Marimo();
