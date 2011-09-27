// TODO don't assume jquery
// TODO don't assume JSON
// TODO fix indentation
function Widget(data) {
    // TODO div_id -> widget_id
    this.id = data.div_id;
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
    function finish(template, context) {
        // TODO make not-mustache-specific
        var html = Mustache.to_html(template, context);
        $('#'+this.id).html(html);
    }
    if (this.data.template_url) {
        // TODO fetch, pass finish as callback
    }
    else { finish(this.data.template, this.data.context); }
};


function BatchRequest(url) {
    this.payloads = [];
    this.url = url;
};

BatchRequest.prototype.add = function(payload) {
    // TODO make more resilient/less trusting in the face of corrupted div_ids etc
    this.payloads.push(payload);
};

BatchRequest.prototype.make_request = function(cb) {
   $.ajax(this.url, {
     data: {bulk:JSON.stringify(this.payloads)},
     dataType: 'json',
     success: function(data) { cb(url, data); },
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
    setTimout(function() {
        var url = widget_args.murl;
        if (!this.requests[url]) {
            this.requests[url] = new BatchRequest(url);
        }
        this.requests[url].add(widget_args);
        var widget = new Widget(widget_args);
        this.widgets[widget.id] = widget;
        this.widgets_in--;
   }, 1);
};

Marimo.prototype.make_request = function() {
    if (this.widgets_in > 0) {
        setTimeout(this.make_request, 100);
        return;
    }
    for (var key in this.requests) {
        if (!this.requests.hasOwnProperty(key)) { return; }
        var batch = this.requests[key];
        batch.make_request(this.handle_response);
    }
};

Marimo.prototype.handle_response = function(url, data) {
    delete this.requests[url];
    for (var key in this.widgets) {
        if (!this.widgets.hasOwnProperty(key)) {return;}
        var widget = this.widgets[key];
        widget.update(data);
    }
    // tell widgets to update based on what is in data.
};

var marimo = new Marimo();

$(function() {
    marimo.make_request();
});
