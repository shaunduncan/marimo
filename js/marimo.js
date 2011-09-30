// TODO don't assume jquery
// TODO don't assume JSON
// TODO fix indentation
function Widget(data) {
    this.id = data.id;
    // TODO write
    this.args = data;
    this.data = {};
}

Widget.prototype.update = function(data) {
    // merge data with this's
    // TODO make this proper update, for now overwrite
    this.data = data;
    this.render();
    // TODO future excitement
};

Widget.prototype.render = function() {
    var that = this;
    // TODO support a template_url
    $(function() {
        // TODO make not-mustache-specific
        var html = Mustache.to_html(that.data.template, that.data.context);
        $('#'+that.id).html(html);
    });
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
   $.ajax(this.url, {
     data: {bulk:JSON.stringify(this.payloads)},
     dataType: 'json',
     success: function(data) { cb(that.url, data); },
     error: function() {
       console.log('error processing bulk request '+this.url+' with json '+JSON.stringify(this.payloads));
     }
   });
};


function Marimo() {
    this.requests = {};
    this.widgets = {};
    this.widgets_in = 0;
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
        var widget = new Widget(widget_args);
        that.widgets[widget.id] = widget;
        that.widgets_in--;
   }, 1);
};

Marimo.prototype.add_widgets = function(widgets) {
    for (var key in widgets) {
        if (!widgets.hasOwnProperty(key)){return;}
        this.add_widget(widgets[key]);
    }
    this.make_request();
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

$(function() {
    // switching to middleware version
    // marimo.make_request();
});
